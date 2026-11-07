<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use libphonenumber\PhoneNumberUtil;
use libphonenumber\PhoneNumberFormat;
use libphonenumber\NumberParseException;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:16|regex:/^\+[1-9]\d{1,14}$/',
            'profile_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // Country-wise phone number validation
        if (!empty($validated['phone'])) {
            try {
                $phoneUtil = PhoneNumberUtil::getInstance();

                $phoneNumber = $phoneUtil->parse(
                    $validated['phone'],
                    null
                );

                if (!$phoneUtil->isValidNumber($phoneNumber)) {
                    return response()->json([
                        'message' => 'Please enter a valid international phone number.',
                        'errors' => [
                            'phone' => ['Invalid phone number for the selected country.']
                        ]
                    ], 422);
                }

                // Store number in international E.164 format
                $validated['phone'] = $phoneUtil->format(
                    $phoneNumber,
                    PhoneNumberFormat::E164
                );

            } catch (NumberParseException $e) {
                return response()->json([
                    'message' => 'Invalid phone number.',
                    'errors' => [
                        'phone' => ['Please enter a valid international phone number.']
                    ]
                ], 422);
            }
        }

        $user = $request->user();

        if ($request->hasFile('profile_image')) {
            $validated['profile_image'] = $request
                ->file('profile_image')
                ->store('profiles', 'public');
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'profile_image' => $user->profile_image,
            ],
        ]);
    }
}
