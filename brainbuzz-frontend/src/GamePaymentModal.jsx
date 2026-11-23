import React, { useState, useEffect } from 'react'
import './GamePaymentModal.css'
import soundService from './services/soundService'
import api from './services/api'

export default function GamePaymentModal({ isOpen, pack, onClose, onSuccess }) {
    const [currency, setCurrency] = useState('INR') // Default INR
    const [appliedOffer, setAppliedOffer] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState('gpay') // 'gpay', 'phonepe', 'paytm', 'upi_qr', 'razorpay'
    const [showAllMethods, setShowAllMethods] = useState(false)
    const [flowState, setFlowState] = useState('sheet') // 'sheet', 'upi_pay', 'verifying', 'success'
    const [errorMessage, setErrorMessage] = useState('')
    const [paymentResult, setPaymentResult] = useState(null)
    const [utrNumber, setUtrNumber] = useState('')
    const [customRazorpayKey, setCustomRazorpayKey] = useState(localStorage.getItem('brainbuzz_rzp_key') || '')
    const [showKeyPrompt, setShowKeyPrompt] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setFlowState('sheet')
            setAppliedOffer(false)
            setShowAllMethods(false)
            setErrorMessage('')
            setPaymentResult(null)
            setUtrNumber('')
            setSelectedMethod('gpay')
            setShowKeyPrompt(false)
        }
    }, [isOpen, pack])

    if (!isOpen || !pack) return null

    // INR Price Mapping
    const inrPriceMap = {
        'pack_starter': { normal: '₹20.00', discounted: '₹10.00', numNormal: 20, numDiscounted: 10 },
        'pack_brainiac': { normal: '₹99.00', discounted: '₹69.00', numNormal: 99, numDiscounted: 69 },
        'pack_master': { normal: '₹249.00', discounted: '₹219.00', numNormal: 249, numDiscounted: 219 },
        'pack_vip': { normal: '₹499.00', discounted: '₹469.00', numNormal: 499, numDiscounted: 469 },
    }

    // USD Price Mapping
    const usdPriceMap = {
        'pack_starter': { normal: '$0.99', discounted: '$0.49', numNormal: 0.99, numDiscounted: 0.49 },
        'pack_brainiac': { normal: '$2.99', discounted: '$1.99', numNormal: 2.99, numDiscounted: 1.99 },
        'pack_master': { normal: '$7.99', discounted: '$4.99', numNormal: 7.99, numDiscounted: 4.99 },
        'pack_vip': { normal: '$14.99', discounted: '$9.99', numNormal: 14.99, numDiscounted: 9.99 },
    }

    const priceInfo = currency === 'INR'
        ? (inrPriceMap[pack.id] || { normal: pack.priceInr || '₹20.00', discounted: '₹10.00', numNormal: 20, numDiscounted: 10 })
        : (usdPriceMap[pack.id] || { normal: pack.price || '$0.99', discounted: '$0.49', numNormal: 0.99, numDiscounted: 0.49 })

    const displayBasePrice = priceInfo.normal
    const displayFinalPrice = appliedOffer ? priceInfo.discounted : priceInfo.normal
    const numericAmount = appliedOffer ? priceInfo.numDiscounted : priceInfo.numNormal

    // Toggle 50% off Play Offer
    const handleToggleOffer = (e) => {
        e.stopPropagation()
        soundService.playClick()
        setAppliedOffer((prev) => !prev)
        setErrorMessage('')
    }

    // Start Purchase
    const handleStartPurchase = async () => {
        soundService.playClick()
        setErrorMessage('')

        // If Razorpay gateway is specifically chosen
        if (selectedMethod === 'razorpay') {
            handleRazorpayCheckout()
            return
        }

        // Default: Real UPI Payment View (GPay, PhonePe, Paytm, QR Code + UTR Verification)
        setFlowState('upi_pay')
    }

    // Direct UPI Payment Link (upi://pay)
    const merchantUpiId = 'brainbuzz.games@okhdfcbank'
    const upiIntentUri = `upi://pay?pa=${merchantUpiId}&pn=BrainBuzzGaming&am=${numericAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(pack.name + ' BrainBuzz')}`
    const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUri)}&bgcolor=1c1b1f&color=ffffff&margin=4`

    // Verify Direct UPI Payment with UTR
    const handleVerifyUpiPayment = async () => {
        if (!utrNumber || utrNumber.trim().length < 10) {
            soundService.playWrong()
            setErrorMessage('Please enter a valid 12-digit UPI UTR / Reference No.')
            return
        }

        soundService.playClick()
        setFlowState('verifying')

        try {
            const res = await api.post('/payment/verify-upi', {
                utr: utrNumber.trim(),
                pack_id: pack.id,
                coins: pack.coins,
                amount: numericAmount,
            })

            if (res.data?.success) {
                soundService.playWin()
                setPaymentResult({
                    paymentId: res.data.payment_id,
                    orderId: res.data.order_id,
                })
                setFlowState('success')

                if (onSuccess) {
                    onSuccess({
                        type: 'purchase',
                        coins: pack.coins,
                        packName: pack.name,
                        orderId: res.data.payment_id,
                        amount: displayFinalPrice,
                        method: 'Google Pay / PhonePe UPI',
                    })
                }
            } else {
                setFlowState('upi_pay')
                setErrorMessage(res.data?.message || 'Verification failed.')
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed. Please check the UTR number.'
            soundService.playWrong()
            setFlowState('upi_pay')
            setErrorMessage(msg)
        }
    }

    // Auto-fill test UTR for quick testing
    const handleAutoFillTestUtr = () => {
        soundService.playClick()
        const testUtr = `${Math.floor(400000000000 + Math.random() * 500000000000)}`
        setUtrNumber(testUtr)
        setErrorMessage('')
    }

    // Razorpay Integration Handler
    const handleRazorpayCheckout = async () => {
        setErrorMessage('')

        // Check if custom key is available
        const activeKey = customRazorpayKey || localStorage.getItem('brainbuzz_rzp_key')

        if (!activeKey) {
            setShowKeyPrompt(true)
            return
        }

        try {
            if (!window.Razorpay) {
                setErrorMessage('Loading Razorpay SDK... please wait a moment.')
                return
            }

            const options = {
                key: activeKey,
                amount: numericAmount * 100,
                currency: 'INR',
                name: 'BrainBuzz Trivia Gaming',
                description: `${pack.name} (+${pack.coins.toLocaleString()} Coins)`,
                image: 'https://cdn-icons-png.flaticon.com/512/807/807262.png',
                prefill: {
                    name: localStorage.getItem('brainbuzz_user_name') || 'Player',
                    email: localStorage.getItem('brainbuzz_user_email') || 'player@brainbuzz.com',
                    contact: '9876543210',
                },
                theme: {
                    color: '#0f172a',
                },
                modal: {
                    ondismiss: function () {
                        setErrorMessage('⚠️ Payment cancelled. No coins were added.')
                    },
                },
                handler: async function (response) {
                    soundService.playWin()
                    setPaymentResult({
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id || `GPA.${Math.floor(1000 + Math.random() * 9000)}`,
                    })
                    setFlowState('success')

                    if (onSuccess) {
                        onSuccess({
                            type: 'purchase',
                            coins: pack.coins,
                            packName: pack.name,
                            orderId: response.razorpay_payment_id,
                            amount: displayFinalPrice,
                            method: 'Razorpay Gateway',
                        })
                    }
                },
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (res) {
                soundService.playWrong()
                setErrorMessage(res.error?.description || 'Payment Failed. Please try UPI QR Code.')
            })
            rzp.open()
        } catch (err) {
            console.error('Razorpay Error:', err)
            setErrorMessage('Razorpay Error: Switch to Direct UPI QR Code below for instant payment.')
        }
    }

    // Save Custom Key ID
    const handleSaveKey = () => {
        if (customRazorpayKey.trim()) {
            localStorage.setItem('brainbuzz_rzp_key', customRazorpayKey.trim())
            setShowKeyPrompt(false)
            handleRazorpayCheckout()
        }
    }

    return (
        <div className="play-sheet-overlay" onClick={flowState === 'verifying' ? null : onClose}>
            <div className="play-sheet-container" onClick={(e) => e.stopPropagation()}>
                {/* Drag handle */}
                <div className="play-sheet-handle"></div>

                {/* ================= VIEW 1: GOOGLE PLAY SHEET ================= */}
                {flowState === 'sheet' && (
                    <>
                        {/* Google Play Brand Header */}
                        <div className="play-brand-header">
                            <div className="play-logo-wrap">
                                <svg className="play-store-svg" width="22" height="22" viewBox="0 0 512 512">
                                    <path fill="#00D3FF" d="M32.5 16.5C24.7 24.6 20 36.6 20 52v408c0 15.4 4.7 27.4 12.5 35.5l2 2L262 268v-6L34.5 14.5l-2 2z"/>
                                    <path fill="#00F076" d="M341 346.5l-79-79.5v-6l79-79.5 2 1.2 93.6 53.2c26.7 15.2 26.7 40 0 55.2L343 345.3l-2 1.2z"/>
                                    <path fill="#FF3A44" d="M343 345.3L262 267 34.5 495.5c8.8 9.3 23.3 10.4 39.5 1.2L343 345.3z"/>
                                    <path fill="#FFC700" d="M343 166.7L74 15.3C57.8 6.1 43.3 7.2 34.5 16.5L262 245l81-78.3z"/>
                                </svg>
                                <span className="play-brand-title">Google Play</span>
                            </div>

                            <div className="play-header-right">
                                <div className="play-curr-toggle">
                                    <button
                                        type="button"
                                        className={`play-curr-btn ${currency === 'INR' ? 'active' : ''}`}
                                        onClick={() => setCurrency('INR')}
                                    >
                                        ₹ INR
                                    </button>
                                    <button
                                        type="button"
                                        className={`play-curr-btn ${currency === 'USD' ? 'active' : ''}`}
                                        onClick={() => setCurrency('USD')}
                                    >
                                        $ USD
                                    </button>
                                </div>
                                <button className="play-sheet-close" onClick={onClose} aria-label="Close">✕</button>
                            </div>
                        </div>

                        {/* Error / Cancel Notification Banner */}
                        {errorMessage && (
                            <div className="play-error-banner">
                                <span>{errorMessage}</span>
                                <button type="button" onClick={() => setErrorMessage('')}>✕</button>
                            </div>
                        )}

                        {/* Product Row */}
                        <div className="play-item-row">
                            <div className="play-item-left">
                                <div className="play-item-icon-box">
                                    <span className="play-item-icon">{pack.icon || '🪙'}</span>
                                </div>
                                <div className="play-item-text">
                                    <div className="play-item-name">{pack.name}</div>
                                    <div className="play-item-app">BrainBuzz Trivia</div>
                                </div>
                            </div>
                            <div className="play-item-price-box">
                                {appliedOffer && (
                                    <span className="play-original-price">{displayBasePrice}</span>
                                )}
                                <span className="play-final-price">{displayFinalPrice}</span>
                            </div>
                        </div>

                        {/* Play Offer / Promo Discount Row */}
                        <div className="play-offer-row">
                            <div className="play-offer-icon">🎁</div>
                            <div className="play-offer-text">
                                <div className="play-offer-title">
                                    {currency === 'INR' ? '50% off (up to ₹30) from Play' : '50% off (up to $1.00) from Play'}
                                </div>
                                <div className="play-offer-sub">
                                    Use within 7 days. <span className="play-link">Terms apply</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className={`play-offer-btn ${appliedOffer ? 'applied' : ''}`}
                                onClick={handleToggleOffer}
                            >
                                {appliedOffer ? 'Applied ✓' : 'Apply'}
                            </button>
                        </div>

                        {/* Selected Payment Method Row */}
                        <div
                            className="play-payment-method-row"
                            onClick={() => setShowAllMethods(!showAllMethods)}
                        >
                            <div className="play-method-icon-wrap">
                                <span className="play-method-pill gpay-pill">
                                    <span className="g-blue">G</span>
                                    <span className="g-red">P</span>
                                    <span className="g-yellow">a</span>
                                    <span className="g-green">y</span>
                                </span>
                            </div>
                            <div className="play-method-name">
                                {selectedMethod === 'razorpay' ? 'Razorpay (Cards / Netbanking)' : 'UPI: GPay / PhonePe / QR Code'}
                            </div>
                            <div className="play-method-check">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="10" fill="#8AB4F8"/>
                                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#041E49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        {/* Promotional Cashback Row */}
                        <div className="play-cashback-row">
                            <div className="play-cashback-icon">
                                <span className="upi-badge-text">UPI</span>
                            </div>
                            <div className="play-cashback-text">
                                <div className="play-cashback-title">Pay with UPI</div>
                                <div className="play-cashback-desc">
                                    Scan & Pay with any UPI App (Google Pay, PhonePe, Paytm, BHIM). Instant 100% real-time verification.
                                </div>
                            </div>
                        </div>

                        {/* View all payment methods accordion toggle */}
                        <div
                            className="play-view-methods-row"
                            onClick={() => setShowAllMethods(!showAllMethods)}
                        >
                            <div className="play-view-methods-left">
                                <svg className="credit-card-svg" width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                                    <line x1="2" y1="10" x2="22" y2="10"/>
                                </svg>
                                <span>View all payment methods</span>
                            </div>
                            <span className="play-chevron">{showAllMethods ? '▲' : '›'}</span>
                        </div>

                        {/* Expanded Payment Methods Drawer */}
                        {showAllMethods && (
                            <div className="play-methods-drawer">
                                <div
                                    className={`play-drawer-item ${selectedMethod === 'gpay' ? 'active' : ''}`}
                                    onClick={() => {
                                        soundService.playClick()
                                        setSelectedMethod('gpay')
                                        setShowAllMethods(false)
                                    }}
                                >
                                    <div className="drawer-item-left">
                                        <span className="play-method-pill gpay-pill">GPay</span>
                                        <span>UPI: Google Pay / PhonePe / QR Code (Recommended)</span>
                                    </div>
                                    {selectedMethod === 'gpay' && (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="10" fill="#8AB4F8"/>
                                            <path d="M6 10.5L8.5 13L14 7.5" stroke="#041E49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>

                                <div
                                    className={`play-drawer-item ${selectedMethod === 'razorpay' ? 'active' : ''}`}
                                    onClick={() => {
                                        soundService.playClick()
                                        setSelectedMethod('razorpay')
                                        setShowAllMethods(false)
                                    }}
                                >
                                    <div className="drawer-item-left">
                                        <span className="play-method-pill card-pill">Razorpay</span>
                                        <span>Razorpay Gateway (Cards / Netbanking)</span>
                                    </div>
                                    {selectedMethod === 'razorpay' && (
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                            <circle cx="10" cy="10" r="10" fill="#8AB4F8"/>
                                            <path d="M6 10.5L8.5 13L14 7.5" stroke="#041E49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Custom Razorpay Key Prompt (if user wants Razorpay) */}
                        {showKeyPrompt && (
                            <div className="razorpay-key-prompt-box">
                                <h4>⚙️ Enter Razorpay Key ID</h4>
                                <p>Razorpay requires your own Key ID (from dashboard.razorpay.com):</p>
                                <div className="key-input-row">
                                    <input
                                        type="text"
                                        placeholder="rzp_test_xxxxxxxxxxxx"
                                        value={customRazorpayKey}
                                        onChange={(e) => setCustomRazorpayKey(e.target.value)}
                                    />
                                    <button type="button" onClick={handleSaveKey}>Save & Pay</button>
                                </div>
                                <button
                                    type="button"
                                    className="key-cancel-link"
                                    onClick={() => {
                                        setShowKeyPrompt(false)
                                        setSelectedMethod('gpay')
                                    }}
                                >
                                    Or use Direct UPI QR Code (Zero Setup)
                                </button>
                            </div>
                        )}

                        {/* Legal terms footer */}
                        <div className="play-sheet-footer-text">
                            Tap "Buy" to complete your purchase. Real-time verification. <span className="play-link">More</span>
                        </div>

                        {/* Primary Google Play "Buy" Pill Button */}
                        <button
                            type="button"
                            className="play-buy-btn"
                            onClick={handleStartPurchase}
                        >
                            Buy • {displayFinalPrice}
                        </button>
                    </>
                )}

                {/* ================= VIEW 2: DIRECT UPI QR CODE & INTENT VIEW ================= */}
                {flowState === 'upi_pay' && (
                    <div className="play-upi-checkout-view">
                        <div className="upi-checkout-header">
                            <button
                                type="button"
                                className="upi-back-btn"
                                onClick={() => {
                                    soundService.playClick()
                                    setFlowState('sheet')
                                }}
                            >
                                ← Back
                            </button>
                            <span className="upi-header-title">Scan & Pay via UPI</span>
                            <button className="play-sheet-close" onClick={onClose}>✕</button>
                        </div>

                        {/* Error Banner */}
                        {errorMessage && (
                            <div className="play-error-banner">
                                <span>{errorMessage}</span>
                                <button type="button" onClick={() => setErrorMessage('')}>✕</button>
                            </div>
                        )}

                        <div className="upi-item-badge">
                            <span className="upi-pack-badge">{pack.name}</span>
                            <span className="upi-amount-badge">{displayFinalPrice}</span>
                        </div>

                        {/* Real Dynamic UPI QR Code */}
                        <div className="upi-qr-wrapper">
                            <img
                                src={upiQrImageUrl}
                                alt="UPI Payment QR Code"
                                className="upi-live-qr-img"
                            />
                            <div className="upi-apps-icons-bar">
                                <span className="u-app gpay">GPay</span>
                                <span className="u-app phonepe">PhonePe</span>
                                <span className="u-app paytm">Paytm</span>
                                <span className="u-app bhim">BHIM</span>
                            </div>
                        </div>

                        {/* On Mobile: Click to open UPI Intent */}
                        <a
                            href={upiIntentUri}
                            className="upi-open-app-btn"
                            onClick={() => soundService.playClick()}
                        >
                            ⚡ Open in GPay / PhonePe / Paytm App
                        </a>

                        <div className="upi-verify-section">
                            <label className="upi-verify-label">
                                Enter 12-Digit UPI Reference No. (UTR) after payment:
                            </label>
                            <div className="upi-input-group">
                                <input
                                    type="text"
                                    className="upi-utr-input"
                                    placeholder="e.g. 432890123456"
                                    maxLength={16}
                                    value={utrNumber}
                                    onChange={(e) => {
                                        setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))
                                        setErrorMessage('')
                                    }}
                                />
                                <button
                                    type="button"
                                    className="upi-test-utr-btn"
                                    title="Auto-fill Demo UTR for testing"
                                    onClick={handleAutoFillTestUtr}
                                >
                                    Auto-Fill Test UTR
                                </button>
                            </div>

                            <button
                                type="button"
                                className="upi-confirm-btn"
                                onClick={handleVerifyUpiPayment}
                            >
                                ✓ Verify Payment & Add Coins
                            </button>
                        </div>
                    </div>
                )}

                {/* ================= VIEW 3: VERIFYING STATE ================= */}
                {flowState === 'verifying' && (
                    <div className="play-processing-view">
                        <div className="play-fingerprint-sensor">
                            <span className="fingerprint-icon">🔍</span>
                            <div className="sensor-ripple"></div>
                        </div>

                        <h3 className="play-process-title">Verifying Payment...</h3>
                        <p className="play-process-sub">Validating UPI transaction with bank gateway</p>

                        <div className="play-process-details">
                            <div className="process-order-tag">{pack.name} • {displayFinalPrice}</div>
                            <div className="process-loader-bar">
                                <div className="process-loader-fill"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= VIEW 4: SUCCESS STATE ================= */}
                {flowState === 'success' && paymentResult && (
                    <div className="play-success-view">
                        <div className="play-success-badge">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>

                        <h3 className="play-success-title">Payment successful</h3>
                        <p className="play-success-sub">Transaction: {paymentResult.paymentId}</p>

                        <div className="play-success-coin-badge">
                            <span>🪙 +{pack.coins.toLocaleString()} Coins Added!</span>
                        </div>

                        <p className="play-success-note">
                            Transaction approved & registered to your account.
                        </p>

                        <button
                            type="button"
                            className="play-done-btn"
                            onClick={() => {
                                soundService.playClick()
                                onClose()
                            }}
                        >
                            Done & Return to Game
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
