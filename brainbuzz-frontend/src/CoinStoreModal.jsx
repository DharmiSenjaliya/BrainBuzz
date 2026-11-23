import React, { useState } from 'react'
import './CoinStoreModal.css'
import soundService from './services/soundService'
import api from './services/api'
import GamePaymentModal from './GamePaymentModal'
import RewardedAdPlayer from './RewardedAdPlayer'

const COIN_PACKS = [
    {
        id: 'pack_starter',
        name: 'Starter Pack',
        coins: 500,
        bonus: '+50 Bonus Coins',
        price: '$0.99',
        priceInr: '₹20.00',
        icon: '🪙',
        tag: null,
    },
    {
        id: 'pack_brainiac',
        name: 'Brainiac Bundle',
        coins: 2500,
        bonus: '+2 Free Hints',
        price: '$2.99',
        priceInr: '₹99.00',
        icon: '💎',
        tag: 'MOST POPULAR',
    },
    {
        id: 'pack_master',
        name: 'Grand Master Pack',
        coins: 10000,
        bonus: '+5 Free Lifelines',
        price: '$7.99',
        priceInr: '₹249.00',
        icon: '👑',
        tag: 'BEST VALUE',
    },
    {
        id: 'pack_vip',
        name: 'VIP Lifetime Pass',
        coins: 25000,
        bonus: 'Ad-Free + Infinite Lifelines',
        price: '$14.99',
        priceInr: '₹499.00',
        icon: '⚡',
        tag: 'PRO ACCESS',
    },
]

export default function CoinStoreModal({ isOpen, onClose, onPurchaseComplete }) {
    const [activeTab, setActiveTab] = useState('coins') // 'coins' or 'ads'
    const [storeCurrency, setStoreCurrency] = useState('INR') // Default INR
    const [purchaseMsg, setPurchaseMsg] = useState('')
    const [adRewardedCount, setAdRewardedCount] = useState(0)

    // Payment Modal State
    const [selectedPack, setSelectedPack] = useState(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    // Rewarded Video Ad Player State
    const [showAdPlayer, setShowAdPlayer] = useState(false)

    if (!isOpen) return null

    // Open Real-time Payment Checkout Modal
    const handleOpenPayment = (pack) => {
        soundService.playClick()
        setSelectedPack(pack)
        setShowPaymentModal(true)
    }

    // Payment Success Callback
    const handlePaymentSuccess = (receiptData) => {
        setPurchaseMsg(`🎉 Payment Approved! Added ${receiptData.coins.toLocaleString()} Coins to your account!`)
        setTimeout(() => setPurchaseMsg(''), 5000)

        if (onPurchaseComplete) {
            onPurchaseComplete({
                type: 'purchase',
                coins: receiptData.coins,
                description: `Store: ${receiptData.packName} (${receiptData.orderId})`,
            })
        }
    }

    // Rewarded Ad Success Callback (Persists to Database)
    const handleAdRewardEarned = async (reward) => {
        setAdRewardedCount((prev) => prev + 1)
        setPurchaseMsg(`🎉 +100 Coins Claimed from Rewarded Ad!`)
        setTimeout(() => setPurchaseMsg(''), 4000)

        // Save Coins to Database via Backend API
        try {
            await api.post('/user/coins/add', {
                coins: 100,
                reason: 'rewarded_ad',
            })
        } catch (err) {
            console.log('User not logged in or offline, coins kept in state')
        }

        if (onPurchaseComplete) {
            onPurchaseComplete({
                type: 'ad_reward',
                coins: 100,
                description: 'Watched 5-Second Rewarded Video Ad (+100 Coins)',
            })
        }
    }

    return (
        <>
            <div className="coin-store-overlay" onClick={onClose}>
                <div className="coin-store-modal" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="modal-close-btn"
                        onClick={() => {
                            soundService.playClick()
                            onClose()
                        }}
                    >
                        ✕
                    </button>

                    <div className="store-header">
                        <div className="store-header-top-row">
                            <h2>Coin Shop</h2>
                            <div className="store-curr-switch">
                                <button
                                    type="button"
                                    className={`store-curr-btn ${storeCurrency === 'INR' ? 'active' : ''}`}
                                    onClick={() => setStoreCurrency('INR')}
                                >
                                    ₹ INR
                                </button>
                                <button
                                    type="button"
                                    className={`store-curr-btn ${storeCurrency === 'USD' ? 'active' : ''}`}
                                    onClick={() => setStoreCurrency('USD')}
                                >
                                    $ USD
                                </button>
                            </div>
                        </div>
                        <p>Get coins, hints, and power-up bundles.</p>
                    </div>

                    <div className="store-tabs">
                        <button
                            className={`store-tab ${activeTab === 'coins' ? 'active' : ''}`}
                            onClick={() => {
                                soundService.playClick()
                                setActiveTab('coins')
                            }}
                        >
                            🪙 Coin Packs
                        </button>
                        <button
                            className={`store-tab ${activeTab === 'ads' ? 'active' : ''}`}
                            onClick={() => {
                                soundService.playClick()
                                setActiveTab('ads')
                            }}
                        >
                            🎬 Free Coins
                        </button>
                    </div>

                    {purchaseMsg && <div className="store-success-banner">{purchaseMsg}</div>}

                    <div className="store-body">
                        {/* --- TAB 1: COIN PACKS --- */}
                        {activeTab === 'coins' && (
                            <div className="packs-grid">
                                {COIN_PACKS.map((pack) => (
                                    <div key={pack.id} className={`pack-card ${pack.tag ? 'has-tag' : ''}`}>
                                        {pack.tag && <div className="pack-tag-pill">{pack.tag}</div>}
                                        <div className="pack-icon">{pack.icon}</div>
                                        <h3 className="pack-title">{pack.name}</h3>
                                        <div className="pack-coins">{pack.coins.toLocaleString()} Coins</div>
                                        <div className="pack-bonus">{pack.bonus}</div>
                                        <button
                                            className="pack-buy-btn"
                                            onClick={() => handleOpenPayment(pack)}
                                        >
                                            Buy for {storeCurrency === 'INR' ? pack.priceInr : pack.price}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* --- TAB 2: FREE COINS VIA REWARDED VIDEO ADS --- */}
                        {activeTab === 'ads' && (
                            <div className="rewarded-ad-box">
                                <div className="ad-card-inner">
                                    <span className="ad-icon">📺</span>
                                    <h3>Watch a Short 5-Second Ad</h3>
                                    <p>
                                        Watch an interactive game trailer and earn{' '}
                                        <strong>+100 Coins</strong> instantly for free!
                                    </p>

                                    {adRewardedCount > 0 ? (
                                        <div className="ad-claimed-state">
                                            <div className="ad-success-msg">
                                                🎉 Reward Unlocked! +100 Coins added to your account.
                                            </div>
                                            <button
                                                className="watch-ad-btn watch-again-btn"
                                                onClick={() => {
                                                    soundService.playClick()
                                                    setShowAdPlayer(true)
                                                }}
                                            >
                                                ▶️ Watch Another Ad (+100 Coins)
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="watch-ad-btn"
                                            onClick={() => {
                                                soundService.playClick()
                                                setShowAdPlayer(true)
                                            }}
                                        >
                                            ▶️ Watch Video Ad (+100 Coins)
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* REAL-TIME PAYMENT GATEWAY CHECKOUT MODAL */}
            <GamePaymentModal
                isOpen={showPaymentModal}
                pack={selectedPack}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />

            {/* AUTHENTIC 5-SECOND REWARDED VIDEO AD PLAYER */}
            <RewardedAdPlayer
                isOpen={showAdPlayer}
                onClose={() => setShowAdPlayer(false)}
                onRewardEarned={handleAdRewardEarned}
            />
        </>
    )
}
