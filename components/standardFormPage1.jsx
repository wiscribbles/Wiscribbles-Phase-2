"use client"

import { useState } from "react"
import { Calendar, Upload, User, FileText, PenTool, CreditCard, Download, ChevronRight } from "lucide-react"

export default function NotarizationForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    countryOfResidence: "",
    email: "",
    identificationType: "Drivers License",
    dateOfIssue: "",
    licenseId: "",
    jurisdiction: "Guyana",
  })

  const steps = [
    { icon: User, text: "Personal Information", active: true },
    { icon: FileText, text: "Document Selection", active: false },
    { icon: PenTool, text: "Signature & Notarization", active: false },
    { icon: CreditCard, text: "Payment Details", active: false },
    { icon: Download, text: "Document Download", active: false },
  ]

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="flex min-h-screen bg-gray-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Form Section */}
      <div className="flex-1 bg-white p-10 lg:p-16 flex flex-col">
        {/* Logo */}
        <div className="flex items-center mb-10">
          <div className="w-15 h-15 rounded-full border-2 border-indigo-500 flex items-center justify-center mr-3 text-indigo-500 font-semibold text-sm">
            
          </div>
          <img
                src="/assets/images/logos/logo.png"
                alt="WiScribbles Logo"
                style={{ maxWidth: "100px", height: "auto" }}
              />
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl lg:text-4xl font-semibold text-indigo-600 mb-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Please, enter your personal information
          </h1>
          <p className="text-gray-600">Enter Your Details to Proceed with Notarisation</p>
        </div>

        {/* Form */}
        <form className="flex-1 flex flex-col space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">First Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Middle Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Last Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>

          {/* Country of Residence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Country of Residence</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              value={formData.countryOfResidence}
              onChange={(e) => handleInputChange("countryOfResidence", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          {/* Identification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">
              Please Select an appropriate form of identification
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white appearance-none cursor-pointer"
              value={formData.identificationType}
              onChange={(e) => handleInputChange("identificationType", e.target.value)}
            >
              <option value="Drivers License">Drivers License</option>
              <option value="Passport">Passport</option>
              <option value="National ID">National ID</option>
              <option value="State ID">State ID</option>
            </select>
          </div>

          {/* Date of Issue and License ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">Date of Issue</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  value={formData.dateOfIssue}
                  onChange={(e) => handleInputChange("dateOfIssue", e.target.value)}
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">
                License ID/ TIN Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                value={formData.licenseId}
                onChange={(e) => handleInputChange("licenseId", e.target.value)}
              />
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right pr-3">
              Jurisdiction of Document Use
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white appearance-none cursor-pointer"
              value={formData.jurisdiction}
              onChange={(e) => handleInputChange("jurisdiction", e.target.value)}
            >
              <option value="Guyana">🇬🇾 Guyana</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
            </select>
            <p className="text-xs text-gray-500 mt-2 italic">
              The jurisdiction for document use refers to the legal authority or region where a notarized document is
              valid and enforceable.
            </p>
          </div>

          {/* Upload Section */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-right pr-3">Upload Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 bg-gray-50 mb-3">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <User size={32} />
              </div>
              <button
                type="button"
                className="bg-gray-800 text-white px-5 py-2.5 rounded text-sm font-medium flex items-center gap-2 mx-auto hover:bg-gray-700 transition-colors"
              >
                <Upload size={16} />
                Upload Image or PDF
              </button>
            </div>
            <p className="text-sm text-gray-600">Please upload a copy of your identification</p>
          </div>

          {/* Next Button */}
          <div className="flex justify-end mt-auto pt-8">
            <button
              type="button"
              className="bg-gray-800 text-white px-8 py-3.5 rounded text-base font-semibold flex items-center gap-2 hover:bg-gray-700 transition-colors"
            >
              NEXT
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-slate-800 text-white p-8 flex flex-col">
        <div className="flex-1">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center mb-10 relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  step.active ? "bg-indigo-600 text-white" : "bg-slate-600 text-slate-400"
                }`}
              >
                <step.icon size={20} />
              </div>
              <div className={`text-sm font-medium ${step.active ? "text-white" : "text-slate-400"}`}>{step.text}</div>
              {index < steps.length - 1 && <div className="absolute left-5 top-12 w-0.5 h-8 bg-slate-600" />}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="text-xs text-slate-400 mb-2">1 to 5 step</div>
          <div className="text-lg font-semibold text-white mb-4">0% to complete</div>
          <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-1/5 transition-all duration-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
