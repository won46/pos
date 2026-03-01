'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface ReceiptProps {
  transaction: Transaction;
}

export function Receipt({ transaction }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(typeof date === 'string' ? new Date(date) : date);
  };

  // Local state to store settings
  const [settings, setSettings] = useState<any>({
    storeName: 'SWIFTPOS',
    storeAddress: 'Jl. Raya Bisnis No. 123, Jakarta',
    storePhone: '021-12345678'
  });

  useEffect(() => {
    // Load store settings from local storage
    const settingsStr = localStorage.getItem('pos_settings');
    if (settingsStr) {
      try {
        const parsed = JSON.parse(settingsStr);
        setSettings({
          storeName: parsed.storeName || 'SWIFTPOS',
          storeAddress: parsed.storeAddress || 'Jl. Raya Bisnis No. 123, Jakarta',
          storePhone: parsed.storePhone || ''
        });
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }
  }, []);

  return (
    <div className="receipt-container">
      {/* Header */}
      <div className="receipt-header">
        <h1>{settings.storeName}</h1>
        <p>{settings.storeAddress}</p>
        {settings.storePhone && <p>Telp: {settings.storePhone}</p>}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Transaction Info */}
      <div className="receipt-info">
        <p><strong>Invoice:</strong> {transaction.invoiceNumber}</p>
        <p><strong>Tanggal:</strong> {formatDateTime(transaction.transactionDate)}</p>
        <p><strong>Kasir:</strong> {transaction.user?.fullName || 'N/A'}</p>
        {transaction.customerName && (
          <p><strong>Customer:</strong> {transaction.customerName}</p>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Items */}
      <table className="receipt-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Disc</th>
            <th>Total</th>
          </tr>
        </thead>
        {transaction.items?.map((item, idx) => (
          <tbody key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <tr>
              <td colSpan={5} style={{ paddingTop: '10px', fontWeight: '500', color: '#374151' }}>
                {item.product?.name || 'Product'}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ textAlign: 'center', paddingBottom: '10px' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', paddingBottom: '10px' }}>{formatCurrency(item.unitPrice)}</td>
              <td style={{ textAlign: 'center', paddingBottom: '10px', color: '#10B981', fontWeight: 'bold' }}>
                {item.discountPercent && item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
              </td>
              <td style={{ textAlign: 'right', paddingBottom: '10px' }}>{formatCurrency(item.totalPrice)}</td>
            </tr>
          </tbody>
        ))}
      </table>

      <div className="receipt-divider">================================</div>

      {/* Totals */}
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>

        {transaction.discountAmount > 0 && (
          <div className="total-row">
            <span>Diskon:</span>
            <span>-{formatCurrency(transaction.discountAmount)}</span>
          </div>
        )}
        <div className="receipt-divider">--------------------------------</div>
        <div className="total-row grand-total">
          <span>TOTAL:</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
      </div>

      <div className="receipt-divider">================================</div>

      {/* Payment */}
      <div className="receipt-payment">
        <div className="total-row">
          <span>Pembayaran:</span>
          <span>{transaction.paymentMethod}</span>
        </div>
        {transaction.paidAmount && (
          <>
            <div className="total-row">
              <span>Bayar:</span>
              <span>{formatCurrency(transaction.paidAmount)}</span>
            </div>
            {transaction.changeAmount !== undefined && transaction.changeAmount > 0 && (
              <div className="total-row">
                <span>Kembali:</span>
                <span>{formatCurrency(transaction.changeAmount)}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="receipt-divider">================================</div>

      {/* Footer */}
      <div className="receipt-footer">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli</p>
        <p>tidak dapat ditukar/dikembalikan</p>
        <p>--- STRUK INI SAH ---</p>
      </div>
    </div>
  );
}
