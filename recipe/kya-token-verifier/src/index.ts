import 'dotenv/config';
import { verifyKyaToken } from './verifyKyaToken';

const token = process.env.KYA_TOKEN!;
const ssi = process.env.EXPECTED_SSI!;
const aud = process.env.EXPECTED_AUD!;

(async () => {
  console.log('🔐 KYA Token Verifier');
  console.log('=====================\n');

  // Validate environment variables
  if (!token) {
    console.error('❌ Error: KYA_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!ssi) {
    console.error('❌ Error: EXPECTED_SSI environment variable is required');
    process.exit(1);
  }

  if (!aud) {
    console.error('❌ Error: EXPECTED_AUD environment variable is required');
    process.exit(1);
  }

  console.log('📋 Verification Parameters:');
  console.log(`   Expected SSI: ${ssi}`);
  console.log(`   Expected Audience: ${aud}`);
  console.log(`   Token: ${token.substring(0, 50)}...`);
  console.log('');

  try {
    console.log('🔍 Verifying token...\n');
    // const result = await verifyKyaToken(token, ssi, aud);

    const response = await fetch("https://api-qa.skyfire.xyz/api/v1/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "skyfire-api-key": "b7e32e58-4f7e-42e6-b265-009ae8d10022"
      },
      body: JSON.stringify({
        type: "kya",
        buyerTag: "Pay-1234",
        sellerServiceId: "c703e88b-f7b8-4d0a-a406-510969106115",
        expiresAt: 1843528592
      })
    });

    console.log("repsonse", response);

    const result = await verifyKyaToken(token, ssi, aud);

    // if (result.error) {
    //   console.log('❌ Token verification failed!');
    //   console.log(`   Error: ${result.error}`);
    // } else {
    //   console.log('✅ Token verification successful!');
    //   console.log('\n📄 Token Payload:');
    //   console.log(JSON.stringify(result.payload, null, 2));
    // }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
})();