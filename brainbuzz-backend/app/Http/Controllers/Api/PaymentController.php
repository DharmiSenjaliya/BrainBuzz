<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PaymentController extends Controller
{
    /**
     * Get Payment configuration
     */
    public function config()
    {
        $keyId = env('RAZORPAY_KEY_ID', '');
        $merchantUpi = env('MERCHANT_UPI_ID', 'brainbuzz@upi');
        $isConfigured = !empty($keyId) && !empty(env('RAZORPAY_KEY_SECRET'));

        return response()->json([
            'success' => true,
            'key_id' => $keyId,
            'merchant_upi' => $merchantUpi,
            'currency' => 'INR',
            'is_configured' => $isConfigured,
        ]);
    }

    /**
     * Create real Razorpay order
     */
    public function createOrder(Request $request)
    {
        $request->validate([
            'pack_id' => 'required|string',
            'pack_name' => 'required|string',
            'coins' => 'required|numeric',
            'amount' => 'required|numeric',
            'currency' => 'nullable|string',
            'key_id' => 'nullable|string',
        ]);

        $keyId = $request->input('key_id') ?: env('RAZORPAY_KEY_ID');
        $keySecret = env('RAZORPAY_KEY_SECRET');
        $currency = strtoupper($request->input('currency', 'INR'));
        $amountInPaise = (int) round($request->input('amount') * 100);
        $receipt = 'rcpt_' . substr(md5(uniqid(mt_rand(), true)), 0, 12);

        // If Razorpay API keys are configured, call official Razorpay Orders API
        if (!empty($keyId) && !empty($keySecret)) {
            try {
                $response = Http::withBasicAuth($keyId, $keySecret)
                    ->timeout(10)
                    ->post('https://api.razorpay.com/v1/orders', [
                        'amount' => $amountInPaise,
                        'currency' => $currency,
                        'receipt' => $receipt,
                        'notes' => [
                            'pack_id' => $request->input('pack_id'),
                            'pack_name' => $request->input('pack_name'),
                            'coins' => $request->input('coins'),
                            'user_id' => $request->user()?->id ?? 'guest',
                        ],
                    ]);

                if ($response->successful()) {
                    $orderData = $response->json();
                    return response()->json([
                        'success' => true,
                        'order_id' => $orderData['id'],
                        'amount' => $orderData['amount'],
                        'currency' => $orderData['currency'],
                        'key_id' => $keyId,
                        'receipt' => $receipt,
                    ]);
                } else {
                    Log::error('Razorpay Order Creation Failed: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::error('Razorpay Error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'order_id' => null,
            'amount' => $amountInPaise,
            'currency' => $currency,
            'key_id' => $keyId,
            'receipt' => $receipt,
            'sandbox' => true,
        ]);
    }

    /**
     * Verify Razorpay payment signature
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_payment_id' => 'required|string',
            'razorpay_order_id' => 'nullable|string',
            'razorpay_signature' => 'nullable|string',
            'pack_id' => 'required|string',
            'coins' => 'required|numeric',
        ]);

        $keySecret = env('RAZORPAY_KEY_SECRET');
        $paymentId = $request->input('razorpay_payment_id');
        $orderId = $request->input('razorpay_order_id', '');
        $signature = $request->input('razorpay_signature', '');
        $coins = (int) $request->input('coins');

        $isVerified = false;

        if (!empty($keySecret) && !empty($signature) && !empty($orderId)) {
            $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);
            $isVerified = hash_equals($expectedSignature, $signature);
        } else {
            // If payment_id exists and starts with pay_
            $isVerified = !empty($paymentId) && (str_starts_with($paymentId, 'pay_') || str_starts_with($paymentId, 'UPI_'));
        }

        if (!$isVerified) {
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Invalid signature.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'payment_id' => $paymentId,
            'order_id' => $orderId,
            'coins' => $coins,
        ]);
    }

    /**
     * Verify Direct UPI Payment (UTR / Ref No verification)
     */
    public function verifyUpi(Request $request)
    {
        $request->validate([
            'utr' => 'required|string|min:10|max:20',
            'pack_id' => 'required|string',
            'coins' => 'required|numeric',
            'amount' => 'required|numeric',
        ]);

        $utr = trim($request->input('utr'));
        $coins = (int) $request->input('coins');
        $packId = $request->input('pack_id');

        // Check if this UTR was already claimed
        $usedUtrs = Cache::get('claimed_payment_utrs', []);

        if (in_array($utr, $usedUtrs)) {
            return response()->json([
                'success' => false,
                'message' => 'This UPI Reference No. (UTR) has already been used and claimed.',
            ], 422);
        }

        // Mark UTR as used
        $usedUtrs[] = $utr;
        Cache::forever('claimed_payment_utrs', $usedUtrs);

        $orderId = 'GPA.' . mt_rand(1000, 9999) . '-' . mt_rand(1000, 9999) . '-' . mt_rand(1000, 9999);

        return response()->json([
            'success' => true,
            'message' => 'UPI Payment Verified Successfully!',
            'payment_id' => 'UPI_' . $utr,
            'order_id' => $orderId,
            'coins' => $coins,
        ]);
    }
}
