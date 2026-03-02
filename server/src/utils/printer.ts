import escpos from 'escpos';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

class WindowsSharedPrinter {
    private buffer: Buffer = Buffer.alloc(0);
    private printerName: string;

    constructor(printerName = '\\\\127.0.0.1\\POS-80') {
        this.printerName = printerName;
    }

    open(callback?: (error: Error | null) => void) {
        this.buffer = Buffer.alloc(0);
        if (callback) callback(null);
        return this;
    }

    write(data: Buffer, callback?: (error: Error | null) => void) {
        this.buffer = Buffer.concat([this.buffer, data]);
        if (callback) callback(null);
        return this;
    }

    close(callback?: (error: Error | null) => void) {
        const tempFile = path.join(process.cwd(), `temp_receipt_${Date.now()}.bin`);
        try {
            fs.writeFileSync(tempFile, this.buffer);
            // Copy binary to shared printer
            exec(`cmd /c copy /B "${tempFile}" "${this.printerName}"`, (error) => {
                // Cleanup temp file
                try { fs.unlinkSync(tempFile); } catch (e) { }

                if (callback) callback(error);
            });
        } catch (error: any) {
            if (callback) callback(error);
        }
        return this;
    }
}

export const printReceipt = async (data: any) => {
    return new Promise((resolve, reject) => {
        try {
            // Use custom adapter for Windows shared printer
            const device = new WindowsSharedPrinter();
            const printer = new escpos.Printer(device as any);

            device.open((error: any) => {
                if (error) {
                    console.error('Error opening printer:', error);
                    return reject(error);
                }

                // 1. Header
                printer
                    .font('B')
                    .align('CT')
                    .size(2, 2)
                    .text(data.storeName || 'SWIFTPOS')
                    .size(1, 1)
                    .text(data.storeAddress || '');

                if (data.storePhone) {
                    printer.text(`Telp: ${data.storePhone}`);
                }

                printer.text('================================');

                // 2. Transaction Info
                printer
                    .align('LT')
                    .text(`Invoice : ${data.invoiceNumber || '-'}`)
                    .text(`Tanggal : ${data.transactionDate || '-'}`)
                    .text(`Kasir   : ${data.cashierName || '-'}`);

                if (data.customerName) {
                    printer.text(`Customer: ${data.customerName}`);
                }

                printer.text('================================');

                // 3. Items
                if (data.items && Array.isArray(data.items)) {
                    printer.text('ITEM');
                    printer.text('QTY    HARGA     DISC%     TOTAL');
                    printer.text('--------------------------------');

                    data.items.forEach((item: any) => {
                        // Line 1: Item Name (Truncate if too long for 32 chars)
                        printer.text(`${item.name}`);

                        // Line 2: Qty, Price, Disc%, Total
                        const qty = `${item.qty}`.padEnd(5);
                        const price = `${item.price}`.padEnd(10);
                        const disc = `${item.discountPercent || 0}%`.padEnd(8);
                        const total = `${item.total}`.padStart(9);

                        printer.text(qty + price + disc + total);
                    });
                }

                printer
                    .text('--------------------------------')
                    .align('RT');

                if (data.subtotal) {
                    printer.text(`Subtotal: ${data.subtotal}`);
                }

                if (data.discountAmount && data.discountAmount > 0) {
                    printer.text(`Total Diskon: -${data.discountAmount}`);
                }

                printer
                    .size(2, 2)
                    .text(`TOTAL: ${data.totalAmount || 0}`)
                    .size(1, 1);

                if (data.amountPaid !== undefined) {
                    printer
                        .text(`Bayar: ${data.amountPaid}`)
                        .text(`Kembali: ${data.change || 0}`);
                }

                printer
                    .align('CT')
                    .text('================================')
                    .text('Terima kasih atas kunjungan Anda!')
                    .text('Barang yang sudah dibeli')
                    .text('tidak dapat ditukar/dikembalikan')
                    .text('--- STRUK INI SAH ---')
                    .text(' ')
                    .text(' ')
                    .cut();

                // Close executes the actual print batch to the shared printer
                printer.close((closeErr: any) => {
                    if (closeErr) {
                        return reject(closeErr);
                    }
                    resolve(true);
                });
            });
        } catch (err) {
            console.error('Printer error:', err);
            reject(err);
        }
    });
};
