import React, { useState } from 'react'
import './AdminCsvImportModal.css'
import api from './services/api'

export default function AdminCsvImportModal({ isOpen, onClose, onImportSuccess }) {
    const [file, setFile] = useState(null)
    const [csvText, setCsvText] = useState('')
    const [mode, setMode] = useState('file') // 'file' or 'text'
    const [uploading, setUploading] = useState(false)
    const [resultMsg, setResultMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    if (!isOpen) return null

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setErrorMsg('')
        }
    }

    const downloadSample = () => {
        window.open(`${api.defaults.baseURL || '/api'}/questions/sample-csv`, '_blank')
    }

    const handleImport = async () => {
        setErrorMsg('')
        setResultMsg('')
        const token = localStorage.getItem('brainbuzz_token')

        if (mode === 'file' && !file) {
            setErrorMsg('Please select a CSV file to upload.')
            return
        }
        if (mode === 'text' && !csvText.trim()) {
            setErrorMsg('Please paste CSV content in the box.')
            return
        }

        try {
            setUploading(true)
            let response

            if (mode === 'file') {
                const formData = new FormData()
                formData.append('file', file)
                response = await api.post('/admin/questions/import-csv', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                })
            } else {
                response = await api.post(
                    '/admin/questions/import-csv',
                    { csv_text: csvText },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
            }

            if (response.data.success) {
                setResultMsg(`🎉 Success! ${response.data.imported_count} questions imported into database.`)
                if (onImportSuccess) onImportSuccess()
                setTimeout(() => {
                    onClose()
                }, 2000)
            }
        } catch (err) {
            console.error('CSV Import Error:', err)
            setErrorMsg(
                err.response?.data?.message || 'Failed to import CSV. Please verify column formats.'
            )
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <div>
                        <h2>Import Questions (CSV)</h2>
                        <p>Upload questions using a CSV spreadsheet.</p>
                    </div>
                    <button className="admin-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="import-mode-tabs">
                    <button
                        className={`import-mode-tab ${mode === 'file' ? 'active' : ''}`}
                        onClick={() => setMode('file')}
                    >
                        📁 Upload CSV File
                    </button>
                    <button
                        className={`import-mode-tab ${mode === 'text' ? 'active' : ''}`}
                        onClick={() => setMode('text')}
                    >
                        📝 Paste Raw CSV Text
                    </button>
                </div>

                {mode === 'file' ? (
                    <div className="dropzone-area">
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            id="csvFileInput"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="csvFileInput" className="dropzone-label">
                            <span className="dropzone-icon">📄</span>
                            {file ? (
                                <strong className="selected-filename">{file.name} ({(file.size / 1024).toFixed(1)} KB)</strong>
                            ) : (
                                <>
                                    <strong>Click or drag CSV file here</strong>
                                    <span>Supports .csv files formatted with ClueShift question columns</span>
                                </>
                            )}
                        </label>
                    </div>
                ) : (
                    <div className="csv-textarea-wrap">
                        <textarea
                            className="csv-textarea"
                            placeholder="category,title,clue1,clue2,clue3,clue4,clue5,answer,hint,level,points&#10;Science,Red Planet,Mars Clue 1,Mars Clue 2,Mars Clue 3,Mars Clue 4,Mars Clue 5,Mars,NASA rover,1,10"
                            rows={8}
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                        />
                    </div>
                )}

                <div className="csv-format-help">
                    <div className="format-info">
                        <strong>Required Columns:</strong> <code>category, title, clue1, clue2, clue3, clue4, clue5, answer, hint, level, points</code>
                    </div>
                    <button type="button" className="sample-download-link" onClick={downloadSample}>
                        ⬇️ Download Sample CSV Template
                    </button>
                </div>

                {errorMsg && <div className="admin-error-box">❌ {errorMsg}</div>}
                {resultMsg && <div className="admin-success-box">{resultMsg}</div>}

                <div className="admin-modal-actions">
                    <button className="admin-cancel-btn" onClick={onClose} disabled={uploading}>
                        Cancel
                    </button>
                    <button className="admin-confirm-btn" onClick={handleImport} disabled={uploading}>
                        {uploading ? 'Importing Questions...' : '🚀 Start Bulk Import'}
                    </button>
                </div>
            </div>
        </div>
    )
}
