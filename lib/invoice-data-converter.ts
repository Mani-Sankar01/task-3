// Utility function to convert invoice data to the format expected by the Invoice component

interface ApiInvoice {
  id: number;
  invoiceId: string;
  membershipId: string;
  invoiceDate: string;
  customerName?: string;
  gstInNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  eWayNumber?: string;
  phoneNumber?: string;
  cGSTInPercent: number;
  sGSTInPercent: number;
  iGSTInPercent: number;
  subTotal: string | number;
  total: string | number;
  status: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: number;
  modifiedBy: number | null;
  invoiceItems?: any[];
}

interface ApiMember {
  id: number;
  membershipId: string;
  applicantName: string;
  firmName: string;
  complianceDetails?: {
    fullAddress?: string;
    gstInNumber?: string;
  };
  firmDetails?: {
    firmName?: string;
    fullAddress?: string;
    gstInNumber?: string;
  };
}

interface InvoiceComponentData {
  invoice: {
    invoiceId: string;
    membershipId: string;
    invoiceDate: string;
    customerName?: string;
    gstInNumber?: string;
    billingAddress?: string;
    shippingAddress?: string;
    eWayNumber?: string;
    phoneNumber?: string;
    cGSTInPercent: number;
    sGSTInPercent: number;
    iGSTInPercent: number;
    subTotal: number;
    total: number;
    invoiceItems: any[];
  };
  member: {
    applicantName: string;
    firmName: string;
    complianceDetails: {
      fullAddress: string;
      gstInNumber: string;
    };
  };
}

export function convertInvoiceData(apiInvoice: ApiInvoice, apiMember: ApiMember): InvoiceComponentData {
  // Normalize invoice data
  const normalizedInvoice = {
    invoiceId: apiInvoice.invoiceId || 'N/A',
    membershipId: apiInvoice.membershipId || 'N/A',
    invoiceDate: apiInvoice.invoiceDate || new Date().toISOString(),
    customerName: apiInvoice.customerName || '',
    gstInNumber: apiInvoice.gstInNumber || '',
    billingAddress: apiInvoice.billingAddress || '',
    shippingAddress: apiInvoice.shippingAddress || '',
    eWayNumber: apiInvoice.eWayNumber || '',
    phoneNumber: apiInvoice.phoneNumber || '',
    cGSTInPercent: apiInvoice.cGSTInPercent || 0,
    sGSTInPercent: apiInvoice.sGSTInPercent || 0,
    iGSTInPercent: apiInvoice.iGSTInPercent || 0,
    subTotal: typeof apiInvoice.subTotal === 'string' ? parseFloat(apiInvoice.subTotal) : apiInvoice.subTotal || 0,
    total: typeof apiInvoice.total === 'string' ? parseFloat(apiInvoice.total) : apiInvoice.total || 0,
    invoiceItems: apiInvoice.invoiceItems ? apiInvoice.invoiceItems.map(item => ({
      hsnCode: item.hsnCode || '',
      particulars: item.particulars || item.particular || '',
      noOfStones: item.stoneCount || item.noOfStones || 0,
      unit: item.size || item.unit || '',
      totalSqFeet: item.totalSqFeet || 0,
      ratePerSqFt: item.ratePerSqFeet || item.ratePerSqFt || 0,
      amount: item.amount || 0
    })) : []
  };

  // Normalize member data
  const normalizedMember = {
    applicantName: apiMember.applicantName || apiMember.firmName || '',
    firmName: apiMember.firmName || apiMember.firmDetails?.firmName || '',
    complianceDetails: {
      fullAddress: apiMember.complianceDetails?.fullAddress || apiMember.firmDetails?.fullAddress || '',
      gstInNumber: apiMember.complianceDetails?.gstInNumber || apiMember.firmDetails?.gstInNumber || ''
    }
  };

  return {
    invoice: normalizedInvoice,
    member: normalizedMember
  };
}

// Function to generate PDF using the Invoice component
export async function generateInvoicePDFWithComponent(invoice: ApiInvoice, member: ApiMember): Promise<void> {
  try {
    // Convert data to component format
    const componentData = convertInvoiceData(invoice, member);
    
    // Import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);
    
    // Create React element (we'll need to use ReactDOM for this)
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const Invoice = (await import('@/components/test-component/invoice')).default;
    
    // Create root and render the component
    const root = ReactDOM.createRoot(tempContainer);
    root.render(React.createElement(Invoice, componentData));
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Configure html2pdf options
    const options = {
      margin: 0.2,
      filename: `Invoice_${componentData.invoice.invoiceId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    // Generate and download PDF
    await html2pdf().set(options).from(tempContainer).save();
    
    // Clean up
    root.unmount();
    document.body.removeChild(tempContainer);
    
  } catch (error) {
    console.error('Error generating PDF with component:', error);
    throw error;
  }
}
