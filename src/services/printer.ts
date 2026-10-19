import { Order, ShopSettings } from '../types/pos';
import { formatCurrency } from './calculator';

export interface PrintOptions {
  width: '80mm' | '55mm';
  isReprint?: boolean;
}

export function generateReceiptHtml(order: Order, settings: ShopSettings, options: PrintOptions): string {
  const is55mm = options.width === '55mm';
  const widthPx = is55mm ? '200px' : '290px';
  const fontSize = is55mm ? '11px' : '12px';
  const dateStr = new Date(order.createdAt).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `
    <div style="width: ${widthPx}; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; line-height: 1.3; color: #000; text-align: left;">
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-size: ${is55mm ? '14px' : '16px'}; font-weight: bold; letter-spacing: 0.5px;">${settings.shopName}</div>
        <div style="font-size: 10px; margin-top: 2px;">${settings.tagline}</div>
        <div style="font-size: 10px;">${settings.location}</div>
        <div style="font-size: 10px;">Tel: ${settings.phones.join(', ')}</div>
        ${options.isReprint ? '<div style="font-weight: bold; border: 1px solid #000; display: inline-block; padding: 1px 6px; margin-top: 4px; font-size: 10px;">*** DUPLICATE / REPRINT ***</div>' : ''}
      </div>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <table style="width: 100%; font-size: ${fontSize}; border-collapse: collapse;">
        <tr>
          <td><strong>Bill #:</strong> ${order.billNumber}</td>
          <td style="text-align: right;"><strong>Order:</strong> ${order.orderNumber}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Date:</strong> ${dateStr}</td>
        </tr>
        <tr>
          <td><strong>Type:</strong> ${order.orderType.replace('_', ' ')}</td>
          <td style="text-align: right;">${order.tableNumber ? `<strong>Table:</strong> ${order.tableNumber}` : ''}</td>
        </tr>
        ${order.customer?.name ? `<tr><td colspan="2"><strong>Customer:</strong> ${order.customer.name} (${order.customer.phone || 'No phone'})</td></tr>` : ''}
        ${order.customer?.address ? `<tr><td colspan="2"><strong>Address:</strong> ${order.customer.address}</td></tr>` : ''}
        <tr>
          <td colspan="2"><strong>Cashier:</strong> ${order.cashierName || 'Staff'}</td>
        </tr>
      </table>

      <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>

      <table style="width: 100%; font-size: ${fontSize}; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: left; padding-bottom: 2px;">Item</th>
            <th style="text-align: center; width: 30px; padding-bottom: 2px;">Qty</th>
            <th style="text-align: right; width: 50px; padding-bottom: 2px;">Rate</th>
            <th style="text-align: right; width: 60px; padding-bottom: 2px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map((item) => {
              const extrasText = item.extras && item.extras.length > 0
                ? `<div style="font-size: 9px; padding-left: 6px;">+ ${item.extras.map((e) => `${e.name} (Rs. ${e.price})`).join(', ')}</div>`
                : '';
              const dealNotes = item.dealIngredients && item.dealIngredients.length > 0
                ? `<div style="font-size: 9px; padding-left: 6px; color: #333;">${item.dealIngredients.map((d) => `${d.quantity}x ${d.productName}`).join(', ')}</div>`
                : '';
              const flavorText = item.selectedPizzaFlavor ? `<div style="font-size: 9px; padding-left: 6px;">Flavor: ${item.selectedPizzaFlavor}</div>` : '';
              const notesText = item.itemNotes ? `<div style="font-size: 9px; font-style: italic; padding-left: 6px;">Note: ${item.itemNotes}</div>` : '';

              return `
                <tr>
                  <td style="padding: 2px 0;">
                    <div>${item.name} ${item.size ? `(${item.size})` : ''}</div>
                    ${flavorText}
                    ${extrasText}
                    ${dealNotes}
                    ${notesText}
                  </td>
                  <td style="text-align: center; vertical-align: top; padding: 2px 0;">${item.quantity}</td>
                  <td style="text-align: right; vertical-align: top; padding: 2px 0;">${item.unitPrice}</td>
                  <td style="text-align: right; vertical-align: top; padding: 2px 0;">${item.unitPrice * item.quantity}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

      <table style="width: 100%; font-size: ${fontSize}; border-collapse: collapse;">
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right;">${formatCurrency(order.subtotal)}</td>
        </tr>
        ${
          order.discountAmount > 0
            ? `<tr>
                <td>Discount ${order.discountType === 'PERCENT' ? `(${order.discount}%)` : ''}:</td>
                <td style="text-align: right;">- ${formatCurrency(order.discountAmount)}</td>
              </tr>`
            : ''
        }
        ${
          order.deliveryCharges > 0
            ? `<tr>
                <td>Delivery Charges:</td>
                <td style="text-align: right;">+ ${formatCurrency(order.deliveryCharges)}</td>
              </tr>`
            : ''
        }
        ${
          order.extraCharges > 0
            ? `<tr>
                <td>Extra Rs.:</td>
                <td style="text-align: right;">+ ${formatCurrency(order.extraCharges)}</td>
              </tr>`
            : ''
        }
        <tr style="border-top: 1px solid #000; font-size: ${is55mm ? '13px' : '15px'}; font-weight: bold;">
          <td style="padding-top: 4px;">Grand Total:</td>
          <td style="text-align: right; padding-top: 4px;">${formatCurrency(order.grandTotal)}</td>
        </tr>
        <tr>
          <td style="padding-top: 2px;">Received Amount:</td>
          <td style="text-align: right; padding-top: 2px;">${formatCurrency(order.receivedAmount)}</td>
        </tr>
        ${
          order.remainingAmount > 0
            ? `<tr style="font-weight: bold; color: #b91c1c;">
                <td>Remaining / Udhaar:</td>
                <td style="text-align: right;">${formatCurrency(order.remainingAmount)}</td>
              </tr>`
            : ''
        }
        ${
          order.changeReturn > 0
            ? `<tr>
                <td>Change Returned:</td>
                <td style="text-align: right;">${formatCurrency(order.changeReturn)}</td>
              </tr>`
            : ''
        }
        <tr>
          <td>Payment Method:</td>
          <td style="text-align: right;"><strong>${order.paymentMethod.replace('_', ' ')}</strong></td>
        </tr>
        <tr>
          <td>Payment Status:</td>
          <td style="text-align: right;"><strong>${order.paymentStatus}</strong></td>
        </tr>
      </table>

      <div style="border-top: 1px dashed #000; margin: 8px 0 4px 0;"></div>

      <div style="text-align: center; font-size: 11px; margin-top: 6px;">
        <div>${settings.footerMessage}</div>
        <div style="font-size: 9px; margin-top: 4px; color: #444;">Software: Dubai Pizza Shop Desktop POS</div>
      </div>
    </div>
  `;
}

export function generateKotHtml(order: Order, settings: ShopSettings, options: PrintOptions): string {
  const is55mm = options.width === '55mm';
  const widthPx = is55mm ? '200px' : '290px';
  const fontSize = is55mm ? '11px' : '12px';
  const dateStr = new Date(order.createdAt).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `
    <div style="width: ${widthPx}; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: ${fontSize}; line-height: 1.3; color: #000; text-align: left;">
      <div style="text-align: center; margin-bottom: 6px;">
        <div style="font-size: 13px; font-weight: bold;">${settings.shopName}</div>
        <div style="font-size: ${is55mm ? '14px' : '16px'}; font-weight: 800; border: 2px solid #000; padding: 2px; margin: 4px 0;">
          KITCHEN ORDER TICKET (KOT)
        </div>
        ${options.isReprint ? '<div style="font-weight: bold; font-size: 10px;">*** KOT REPRINT ***</div>' : ''}
      </div>

      <table style="width: 100%; font-size: ${fontSize}; border-collapse: collapse;">
        <tr>
          <td><strong>KOT #:</strong> ${order.kotNumber}</td>
          <td style="text-align: right;"><strong>Order:</strong> ${order.orderNumber}</td>
        </tr>
        <tr>
          <td><strong>Time:</strong> ${dateStr}</td>
          <td style="text-align: right;"><strong>${order.orderType.replace('_', ' ')}</strong></td>
        </tr>
        ${order.tableNumber ? `<tr><td colspan="2" style="font-size: 14px; font-weight: bold; border: 1px dashed #000; text-align: center; padding: 2px;">TABLE: ${order.tableNumber}</td></tr>` : ''}
        ${order.orderType === 'DELIVERY' && order.customer?.name ? `<tr><td colspan="2"><strong>Delivery to:</strong> ${order.customer.name}</td></tr>` : ''}
      </table>

      <div style="border-top: 2px solid #000; margin: 6px 0;"></div>

      <table style="width: 100%; font-size: ${fontSize}; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="text-align: center; width: 40px; padding-bottom: 2px; font-size: 13px;">Qty</th>
            <th style="text-align: left; padding-bottom: 2px; font-size: 13px;">Item & Details</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map((item) => {
              const extrasText = item.extras && item.extras.length > 0
                ? `<div style="font-size: 10px; font-weight: bold; color: #000;">+ TOPPINGS: ${item.extras.map((e) => e.name).join(', ')}</div>`
                : '';
              const flavorText = item.selectedPizzaFlavor
                ? `<div style="font-size: 10px; font-weight: bold;">FLAVOR: ${item.selectedPizzaFlavor}</div>`
                : '';
              const notesText = item.itemNotes
                ? `<div style="font-size: 10px; font-style: italic; background: #eee; padding: 1px 3px;">Note: ${item.itemNotes}</div>`
                : '';

              // DEAL BREAKDOWN IS MANDATORY FOR KITCHEN TICKET:
              let dealBreakdown = '';
              if (item.isDeal && item.dealIngredients && item.dealIngredients.length > 0) {
                dealBreakdown = `
                  <div style="margin-top: 3px; padding-left: 6px; border-left: 2px solid #000; font-size: 11px;">
                    <div style="font-weight: bold; text-decoration: underline;">Kitchen Prep Components:</div>
                    ${item.dealIngredients
                      .map((ing) => `<div>• ${ing.quantity * item.quantity}x ${ing.productName} ${ing.size ? `(${ing.size})` : ''} ${ing.selectedFlavor ? `[${ing.selectedFlavor}]` : ''}</div>`)
                      .join('')}
                  </div>
                `;
              }

              return `
                <tr style="border-bottom: 1px dashed #aaa;">
                  <td style="text-align: center; vertical-align: top; padding: 4px 0; font-size: 14px; font-weight: bold;">
                    [ ${item.quantity} ]
                  </td>
                  <td style="padding: 4px 0 4px 6px;">
                    <div style="font-weight: bold; font-size: 13px;">
                      ${item.name} ${item.size ? `(${item.size})` : ''}
                    </div>
                    ${flavorText}
                    ${extrasText}
                    ${notesText}
                    ${dealBreakdown}
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      ${
        order.notes
          ? `<div style="margin-top: 6px; border: 1px dashed #000; padding: 3px; font-size: 11px;">
              <strong>Special Order Note:</strong> ${order.notes}
            </div>`
          : ''
      }

      <div style="border-top: 2px solid #000; margin: 8px 0 4px 0;"></div>
      <div style="text-align: center; font-size: 10px; font-weight: bold;">
        --- END OF KOT #${order.kotNumber} ---
      </div>
    </div>
  `;
}

export function printThermalDocument(htmlContent: string): void {
  // Use a dedicated print window or hidden iframe to ensure proper printing without disrupting main UI
  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.top = '-9999px';
  printFrame.style.left = '-9999px';
  printFrame.style.width = '300px';
  printFrame.style.height = '600px';
  printFrame.style.border = 'none';

  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow?.document;
  if (!doc) {
    console.error('Cannot access iframe document for printing');
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print POS Document</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
            padding: 2mm 3mm;
            background: #fff;
            color: #000;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.postMessage({ type: 'POS_PRINT_DONE' }, '*');
              }, 500);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();

  // Remove iframe after printing completes
  setTimeout(() => {
    if (document.body.contains(printFrame)) {
      document.body.removeChild(printFrame);
    }
  }, 4000);
}
