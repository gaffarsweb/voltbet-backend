import axios from 'axios';
import bs58 from 'bs58';
import mongoose from 'mongoose';
import networkModel from '../models/network.model';
import webhookModel from '../models/webhook.model';
import webhookAddressModel from '../models/webhookAddress.model';

const MAX_ADDRESSES = 45000;

/**
 * Alchemy Webhook Service
 * Assigns wallet addresses to Alchemy webhooks for deposit monitoring
 */
export class AlchemyWebhookService {
  private static getWebhookUrl(networkType: string): string {
    if (networkType === 'SOLANA') {
      return process.env.ALCHEMY_WEB_CALLBACK_URL_WEBHOOK_SOLANA 
        || 'https://apistaging.moneytreegaming.com/api/deposits/webhook/alchemy/sol';
    }
    return process.env.ALCHEMY_WEB_CALLBACK_URL_WEBHOOK 
      || 'https://apistaging.moneytreegaming.com/api/deposits/webhook/alchemy/evm';
  }

  private static getAuthToken(): string {
    return process.env.ALCHEMY_WEB_AUTH_TOKEN || 'YQ2Vju3cOJwZOPW0uTU7E2HUVEImjbae';
  }

  /**
   * Normalize address based on network type
   */
  private static normalizeAddress(address: string, networkType: string): string {
    if (networkType === 'EVM') return address.toLowerCase();
    // SOLANA — NEVER TOUCH CASE
    return address.trim();
  }

  /**
   * Assign a single address to Alchemy webhook
   */
  static async assignAddress(networkId: string, address: string): Promise<string | null> {
    // Convert networkId to mongoose ObjectId if needed
    const networkObjectId = new mongoose.Types.ObjectId(networkId);

    const network = await networkModel.findById(networkObjectId);
    if (!network) {
      console.error(`Network not found: ${networkId}`);
      return null;
    }

    if (!['EVM', 'SOLANA'].includes(network.type)) {
      console.log(`Skipping webhook assignment for network type: ${network.type}`);
      return null;
    }

    const normalizedAddress = this.normalizeAddress(address, network.type);

    // Check if already assigned (idempotent)
    const existingMapping = await webhookAddressModel.findOne({
      networkId: networkObjectId,
      address: normalizedAddress,
    } as any);

    if (existingMapping) {
      console.log(`Address ${normalizedAddress} already assigned to webhook`);
      const webhook = await webhookModel.findById(existingMapping.webhookId);
      return webhook?.webhookId || null;
    }

    try {
      // STEP 1: Reserve slot atomically
      let webhook = await this.reserveWebhookSlot(networkObjectId);

      // STEP 2: If none available, create ONE webhook safely
      if (!webhook) {
        webhook = await this.createWebhookSingleton(network, normalizedAddress);
        if (!webhook) return null;
      }

      // STEP 3: Add address to Alchemy
      await this.addAddressToAlchemy(webhook.webhookId, normalizedAddress);

      // STEP 4: Save mapping (idempotent)
      await webhookAddressModel.findOneAndUpdate(
        { networkId: networkObjectId, address: normalizedAddress } as any,
        {
          webhookId: webhook._id,
          networkId: networkObjectId,
          address: normalizedAddress,
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Assigned address ${normalizedAddress} to webhook ${webhook.webhookId}`);
      return webhook.webhookId;

    } catch (err) {
      console.error(`Failed to assign address to webhook:`, err);
      throw err;
    }
  }

  /**
   * Atomic slot reservation - prevents webhook overflow
   */
  private static async reserveWebhookSlot(networkId: mongoose.Types.ObjectId): Promise<any> {
    const session = await mongoose.startSession();
    
    try {
      let result: any = null;
      
      await session.withTransaction(async () => {
        const webhook = await webhookModel.findOne({
          networkId,
          provider: 'ALCHEMY',
          status: 'ACTIVE',
          addressCount: { $lt: MAX_ADDRESSES }
        } as any).session(session);

        if (!webhook) {
          return;
        }

        // Increment address count
        const updated = await webhookModel.findByIdAndUpdate(
          webhook._id,
          { $inc: { addressCount: 1 } },
          { new: true }
        ).session(session);

        // If reached max, mark as FULL
        if (updated && updated.addressCount >= MAX_ADDRESSES) {
          await webhookModel.findByIdAndUpdate(
            webhook._id,
            { status: 'FULL' }
          ).session(session);
        }

        result = updated;
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Create singleton webhook - prevents multiple workers creating multiple webhooks
   */
  private static async createWebhookSingleton(network: any, firstAddress: string): Promise<any> {
    const session = await mongoose.startSession();
    
    try {
      let result: any = null;
      
      await session.withTransaction(async () => {
        // Double check inside transaction
        let existing = await webhookModel.findOne({
          networkId: network._id,
          provider: 'ALCHEMY',
          status: 'ACTIVE'
        } as any).session(session);

        if (existing) {
          // Increment address count for the first address
          await webhookModel.findByIdAndUpdate(
            existing._id,
            { $inc: { addressCount: 1 } }
          ).session(session);
          result = existing;
          return;
        }

        const webhookUrl = this.getWebhookUrl(network.type);

        console.log(`Creating webhook for network: ${network.name}, type: ${network.type}`);

        const res = await axios.post(
          'https://dashboard.alchemy.com/api/create-webhook',
          {
            network: network.alchemyNetwork,
            webhook_type: 'ADDRESS_ACTIVITY',
            addresses: [firstAddress],
            webhook_url: webhookUrl
          },
          {
            headers: {
              'X-Alchemy-Token': this.getAuthToken(),
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Webhook created:', res.data);

        result = await webhookModel.create([{
          networkId: network._id,
          webhookId: res.data.data.id,
          provider: 'ALCHEMY',
          addressCount: 1,
          maxAddresses: MAX_ADDRESSES,
          status: 'ACTIVE',
        }], { session });

        result = result[0];
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Add address to Alchemy webhook
   */
  private static async addAddressToAlchemy(webhookId: string, address: string) {
    await axios.patch(
      'https://dashboard.alchemy.com/api/update-webhook-addresses',
      {
        webhook_id: webhookId,
        addresses_to_add: [address],
        addresses_to_remove: [],
      },
      {
        headers: {
          'X-Alchemy-Token': this.getAuthToken(),
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
  }

  /**
   * Validate address format for network type
   */
  static validateAddress(address: string, networkType: string): boolean {
    if (networkType === 'EVM') {
      return /^0x[a-f0-9]{40}$/.test(address.toLowerCase());
    } else if (networkType === 'SOLANA') {
      try {
        const decoded = bs58.decode(address);
        return decoded.length === 32;
      } catch {
        return false;
      }
    }
    return true;
  }
}