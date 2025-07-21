import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

const DetailItem = ({ label, value }) => (
  <div className="py-2 flex justify-between border-b border-gray-200">
    <span className="font-semibold text-gray-600">{label}</span>
    <span className="text-gray-800 text-right">{value}</span>
  </div>
);

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoices/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error("Failed to fetch invoice details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading Invoice Details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-red-500">
        Invoice not found.
      </div>
    );
  }


  const DetailItem = ({ label, value }) => (
  <div className="flex justify-between py-2">
    <span className="text-gray-400">{label}</span>
    <span className="text-gray-100">{value}</span>
  </div>
);

  // Safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-[#0f172a] text-white min-h-screen">
  <Link to="/" className="text-cyan-400 hover:underline mb-8 block">
    ← Back to Dashboard
  </Link>

  <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl border border-white/10">
    {/* Header */}
    <header className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-white/10 pb-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Invoice</h1>
        <p className="text-gray-400 mt-1">Invoice #{invoice.metadata.number}</p>
      </div>
      <div className="text-left md:text-right mt-4 md:mt-0">
        <p className="text-xl font-semibold">{invoice.parties.supplier.name}</p>
        <p className="text-gray-400">{invoice.parties.supplier.address?.line1}</p>
        <p className="text-gray-400">
          {invoice.parties.supplier.address?.city},{" "}
          {invoice.parties.supplier.address?.state}
        </p>
      </div>
    </header>

    {/* Bill To & Details */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-8">
      <div className="bg-gray-800 p-5 rounded-lg border border-white/10">
        <h2 className="text-xl font-semibold border-b border-white/10 pb-2 mb-4 text-cyan-300">Bill To</h2>
        <p className="font-bold">{invoice.parties.customer.name}</p>
        <p>{invoice.parties.customer.address?.line1}</p>
        <p>{invoice.parties.customer.address?.city}</p>
        <p className="text-gray-400">GSTIN: {invoice.parties.customer.taxInfo?.gstin || "N/A"}</p>
      </div>
      <div className="bg-gray-800 p-5 rounded-lg border border-white/10 text-gray-100">

            <h2 className="text-xl font-semibold border-b pb-2 mb-4 ">
              Details
            </h2>
            <DetailItem
              label="Invoice Date"
              value={formatDate(invoice.metadata.date)}
            />
            <DetailItem
              label="Due Date"
              value={formatDate(invoice.metadata.dueDate)}
            />
            <DetailItem label="Currency" value={invoice.metadata.currency} />

            
          </div>
    </div>

    {/* Line Items */}
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-green-400">Line Items</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-700 text-gray-200">
            <tr>
              <th className="text-left font-semibold p-3">Description</th>
              <th className="text-right font-semibold p-3">Quantity</th>
              <th className="text-right font-semibold p-3">Rate</th>
              <th className="text-right font-semibold p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/70">
                  <td className="p-3">{item.description || "N/A"}</td>
                  <td className="text-right p-3">{item.quantity}</td>
                  <td className="text-right p-3">
                    {invoice.metadata.currency} {item.rate.toFixed(2)}
                  </td>
                  <td className="text-right p-3">
                    {invoice.metadata.currency} {item.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-400">
                  No line items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Totals */}
    <div className="mt-8 flex justify-end">
      <div className="w-full md:w-1/3 bg-gray-800 p-5 rounded-lg border border-white/10">
        <DetailItem
          label="Subtotal"
          value={`${invoice.metadata.currency} ${invoice.amounts.subtotal.toFixed(2)}`}
        />
        <DetailItem
          label="Tax Total"
          value={`${invoice.metadata.currency} ${invoice.amounts.tax.total.toFixed(2)}`}
        />
        <div className="py-2 flex justify-between border-t-2 border-gray-600 mt-2 pt-2">
          <span className="font-bold text-xl text-yellow-300">Grand Total</span>
          <span className="font-bold text-xl">
            {invoice.metadata.currency} {invoice.amounts.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default InvoiceDetail;
