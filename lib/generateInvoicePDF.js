"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Function to convert number to words
function convertNumberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  function convertHundreds(n) {
    let result = '';
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      result += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  }
  
  if (num === 0) return 'Zero';
  
  let result = '';
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;
  
  if (crores > 0) {
    result += convertHundreds(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    result += convertHundreds(hundreds);
  }
  
  return result.trim();
}

export const generateInvoicePDF = async (invoiceData, memberData) => {
  // Create a hidden container for the invoice
  const container = document.createElement("div");
  container.className =
    "p-8 bg-white text-gray-800 font-sans mx-auto border rounded-lg";
  container.style.width = "210mm";
  container.style.minHeight = "297mm";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "12px";
  container.style.lineHeight = "1.4";

  // ✅ Invoice Header
  container.innerHTML = `
    <div class="flex justify-between items-start mb-4 border-b pb-2">
      <div>
        <p class="font-medium text-gray-600 mb-1" text-sm>
          <span class="font-semibold text-black">Invoice No:</span> ${invoiceData.invoiceId}
        </p>
      </div>
      <div class="text-right">
        <p class="font-medium text-gray-700" text-sm>
          <span class="font-semibold">Date:</span> ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-GB')}
        </p>
      </div>
    </div>

    <!-- Company Details -->
    <div class="text-center mb-4">
      <h1 class="font-bold text-gray-900 text-2xl">${memberData.firmName}</h1>
      <p class="text-gray-600 text-sm" >${memberData.complianceDetails.fullAddress}</p>
      <p class="text-gray-600 text-sm" >
        GSTIN: ${memberData.complianceDetails.gstInNumber}
      </p>
    </div>

    <!-- Customer Info -->
    <h2 class="font-semibold mb-2 border-b pb-2 text-lg">Customer Information</h2>
    <div class="grid grid-cols-2 mb-4 bg-blue-50 rounded p-3 text-xs">
      <p style="margin-bottom: 2px;"><span class="font-semibold">Customer Name:</span> ${invoiceData.customerName}</p>
      <p style="margin-bottom: 2px;"><span class="font-semibold">GSTIN Number:</span> ${invoiceData.gstInNumber}</p>
      <p style="margin-bottom: 2px;"><span class="font-semibold">Phone Number:</span> ${invoiceData.phoneNumber}</p>
      <p style="margin-bottom: 2px;"><span class="font-semibold">E-Way Number:</span> ${invoiceData.eWayNumber}</p>
      <p style="margin-bottom: 2px;"><span class="font-semibold">Billing Address:</span> ${invoiceData.billingAddress}</p>
      <p style="margin-bottom: 2px;"><span class="font-semibold">Shipping Address:</span> ${invoiceData.shippingAddress}</p>
    </div>

    <!-- Invoice Items -->
    <h2 class="font-semibold mb-2 border-b pb-2 text-lg">Invoice Items</h2>
     <table class="w-full border-collapse mb-4 text-xs" >
       <thead class="bg-blue-50">
         <tr>
           <th class="border pb-2 px-2 text-left font-semibold text-xs" >HSN Code</th>
           <th class="border pb-2 px-2 text-left font-semibold text-xs" >Particulars</th>
           <th class="border pb-2 px-2 text-center font-semibold text-xs" >No. of Stones</th>
           <th class="border pb-2 px-2 text-center font-semibold text-xs" >Size</th>
           <th class="border pb-2 px-2 text-center font-semibold text-xs" >Total Sq. Ft.</th>
           <th class="border pb-2 px-2 text-center font-semibold text-xs" >Rate (₹)</th>
           <th class="border pb-2 px-2 text-right font-semibold text-xs" >Amount (₹)</th>
         </tr>
       </thead>
      <tbody>
         ${invoiceData.invoiceItems
           .map(
             (item) => `
           <tr class="border-b">
             <td class="border pb-2 px-2 text-center text-xs">${item.hsnCode}</td>
             <td class="border pb-2 px-2 text-center text-xs">${item.particulars}</td>
             <td class="border pb-2 px-2 text-center text-xs">${item.noOfStones}</td>
             <td class="border pb-2 px-2 text-center text-xs">${item.unit}</td>
             <td class="border pb-2 px-2 text-center text-xs">${item.totalSqFeet}</td>
             <td class="border pb-2 px-2 text-center text-xs">₹${item.ratePerSqFt.toLocaleString()}</td>
             <td class="border pb-2 px-2 text-right text-xs">₹${item.amount.toLocaleString()}</td>
           </tr>`
           )
           .join("")}
      </tbody>
    </table>

     <!-- Totals -->
     <div class="text-right pr-2 text-sm">
       <p style="margin-bottom: 2px;">Sub Total: ₹${invoiceData.subTotal.toLocaleString()}</p>
       <p style="margin-bottom: 2px;">CGST (${invoiceData.cGSTInPercent}%): ₹${Math.round((invoiceData.subTotal * invoiceData.cGSTInPercent) / 100).toLocaleString()}</p>
       <p style="margin-bottom: 2px;">SGST (${invoiceData.sGSTInPercent}%): ₹${Math.round((invoiceData.subTotal * invoiceData.sGSTInPercent) / 100).toLocaleString()}</p>
       <hr class="mt-4 border-gray-300">
     </div>
     
     <!-- Amount in Words and Total -->
     <div class="flex justify-between items-start mt-2">
       <div class="text-left text-sm" style="width: 50%;">
         <p class="font-semibold text-gray-700 mb-2">Amount in Words:</p>
         <p class="text-gray-600 italic" style="font-size: 11px; line-height: 1.3;">
           ${convertNumberToWords(invoiceData.total)} Rupees Only
         </p>
       </div>
       <div class="text-right pr-2 text-sm" style="width: 50%;">
         <p class="font-bold text-lg">Total: ₹${invoiceData.total.toLocaleString()}</p>
       </div>
     </div>

     <!-- Footer -->
     <div class="mt-6 flex justify-between items-end">
       <div class="text-left text-gray-600" style="font-size: 9px; line-height: 1.4;">
         <p class="font-semibold text-gray-700 mb-2">Terms & Conditions:</p>
         <p>1. This invoice is subject to Tandur Jurisdiction.</p>
         <p>2. We are not responsible for any damage during transportation or handling.</p>
         <p>3. Payment terms: As per agreement between parties.</p>
         <p class="mt-2 font-medium">Thank you for your business!</p>
       </div>
       <div class="text-center" style="font-size: 10px; margin-top: 20px;">
         <div class="border-t border-gray-400 pt-2" style="width: 120px;">
           <p class="text-gray-600 mb-1">Authorized Signature</p>
           <div class="h-8 border-b border-gray-300"></div>
           <p class="text-gray-500 mt-1">Stamp & Date</p>
         </div>
       </div>
     </div>
  `;

  document.body.appendChild(container);

  // Capture as canvas with optimized settings
  const canvas = await html2canvas(container, { 
    scale: 2,
    useCORS: true,
    letterRendering: true,
    backgroundColor: '#ffffff',
    width: 210 * 3.78, // Convert mm to pixels (210mm * 3.78px/mm)
    height: 297 * 3.78  // Convert mm to pixels (297mm * 3.78px/mm)
  });
  
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${invoiceData.invoiceId}.pdf`);
  document.body.removeChild(container);
};
