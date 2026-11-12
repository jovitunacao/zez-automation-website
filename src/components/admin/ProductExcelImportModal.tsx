import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  Search, 
  RefreshCw, 
  Check, 
  Info, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  Package, 
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  Product, 
  ProductCategory, 
  Brand, 
  AdminUserSession 
} from '../../types';
import { 
  ImportMode, 
  ParsedImportRow, 
  ImportValidationSummary, 
  BulkImportSummary 
} from '../../types/excelImport';
import { 
  generateProductExcelTemplate, 
  parseProductExcel, 
  generateValidationErrorReport, 
  executeBulkProductImport, 
  downloadWorkbook 
} from '../../services/excelImportService';

interface ProductExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  categories: ProductCategory[];
  brands: Brand[];
  adminUser: AdminUserSession | null;
  onImportComplete: () => Promise<void>;
}

export const ProductExcelImportModal: React.FC<ProductExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  categories,
  brands,
  adminUser,
  onImportComplete
}) => {
  // Navigation & Step State: 'upload' | 'preview' | 'importing' | 'summary'
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'summary'>('upload');

  // File & Parsing State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [validationSummary, setValidationSummary] = useState<ImportValidationSummary | null>(null);

  // Template Download State
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  // Import Options (Preferences requested: mode=upsert, publish=false, preserve=true)
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [preserveBlankFields, setPreserveBlankFields] = useState(true);

  // Preview Table Filter & Search
  const [tableFilter, setTableFilter] = useState<'all' | 'valid' | 'errors' | 'warnings' | 'new' | 'updates'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Execution Progress & Results
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: ''
  });
  const [importSummary, setImportSummary] = useState<BulkImportSummary | null>(null);
  const [generatingErrorReport, setGeneratingErrorReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle Template Download
  const handleDownloadTemplate = async () => {
    setGeneratingTemplate(true);
    try {
      const buffer = await generateProductExcelTemplate(categories, brands);
      downloadWorkbook(buffer, 'ZEZ_Product_Catalog_Import_Template.xlsx');
    } catch (err: any) {
      alert(`Error generating Excel template: ${err.message || 'Unknown error'}`);
    } finally {
      setGeneratingTemplate(false);
    }
  };

  // Handle File Selection
  const handleFileChange = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setParseError('Please upload a genuine .xlsx Excel workbook.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setParsing(true);

    try {
      const { rows, summary } = await parseProductExcel(file, existingProducts, categories);
      setParsedRows(rows);
      setValidationSummary(summary);
      setCurrentStep('preview');
      setCurrentPage(1);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse Excel workbook.');
    } finally {
      setParsing(false);
    }
  };

  // Handle Error Report Download
  const handleDownloadErrorReport = async () => {
    if (!parsedRows.length) return;
    setGeneratingErrorReport(true);
    try {
      const buffer = await generateValidationErrorReport(parsedRows);
      downloadWorkbook(buffer, `ZEZ_Import_Validation_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert(`Error generating error report: ${err.message}`);
    } finally {
      setGeneratingErrorReport(false);
    }
  };

  // Execute Import
  const handleStartImport = async (skipInvalidRows = false) => {
    setShowConfirmModal(false);
    setCurrentStep('importing');
    setImportProgress({
      current: 0,
      total: parsedRows.length,
      message: 'Initializing batch import engine...'
    });

    try {
      const summary = await executeBulkProductImport(
        {
          rows: parsedRows,
          mode: importMode,
          preserveBlankFields,
          skipInvalidRows,
          adminUser,
          onProgress: (current, total, message) => {
            setImportProgress({ current, total, message });
          }
        },
        existingProducts
      );

      setImportSummary(summary);
      setCurrentStep('summary');
      await onImportComplete();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
      setCurrentStep('preview');
    }
  };

  // Filtered Preview Rows
  const filteredRows = useMemo(() => {
    return parsedRows.filter((row) => {
      // Status filter
      if (tableFilter === 'valid' && row.status !== 'valid') return false;
      if (tableFilter === 'errors' && row.status !== 'error') return false;
      if (tableFilter === 'warnings' && row.status !== 'warning') return false;
      if (tableFilter === 'new' && row.isExisting) return false;
      if (tableFilter === 'updates' && !row.isExisting) return false;

      // Search filter
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        const matchSku = row.sku.toLowerCase().includes(q);
        const matchName = row.name.toLowerCase().includes(q);
        const matchBrand = row.brand.toLowerCase().includes(q);
        const matchCat = row.categoryName.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    });
  }, [parsedRows, tableFilter, previewSearch]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset modal state
  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setValidationSummary(null);
    setParseError(null);
    setImportSummary(null);
    setCurrentStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-[#292F36]">
        
        {/* MODAL HEADER */}
        <div className="bg-[#292F36] text-white px-6 py-4 flex items-center justify-between border-b-4 border-[#B5121B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B5121B] flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Bulk Product Excel Import</h2>
                <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded uppercase font-semibold">
                  Administrator Console
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Batch create or update ICT hardware items, technical specifications, and reference pricing via .xlsx
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            title="Close import modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: FILE UPLOAD & PREFERENCES */}
          {currentStep === 'upload' && (
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              
              {/* Template Download Card */}
              <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#292F36]">Standardized Product Import Template</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded font-semibold">
                      Genuine .xlsx
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 max-w-xl">
                    Download the pre-formatted Excel template with embedded dropdowns for all {categories.length} catalog categories, stock statuses, pricing modes, and sample enterprise rows.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  disabled={generatingTemplate}
                  className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {generatingTemplate ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Generating Template...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download Excel Template</span>
                    </>
                  )}
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-[#B5121B] bg-gray-50 hover:bg-red-50/20 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer space-y-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 group-hover:border-[#B5121B]/30 group-hover:bg-red-50/50 flex items-center justify-center mx-auto text-gray-500 group-hover:text-[#B5121B] shadow-xs transition-all">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">
                    Click to browse or drag and drop your completed .xlsx file
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Accepts valid Excel workbooks (.xlsx) with products on the first or "Products" worksheet
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-medium text-gray-600 shadow-2xs">
                  <span>Capacity: Up to 500+ items per batch</span>
                </div>
              </div>

              {/* Parsing Indicator */}
              {parsing && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center gap-3 text-xs text-blue-900 shadow-2xs">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="font-semibold">Reading workbook, validating SKUs, and checking category references...</span>
                </div>
              )}

              {/* Parsing Error */}
              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-900 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-950">File Validation Failed</h4>
                    <p className="text-red-800 text-[11px] mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Import Configuration & Preferences */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <Sliders className="w-4 h-4 text-[#B5121B]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                    Import Rules & Update Behavior Preferences
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-700">Import Mode</label>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg font-semibold focus:outline-none focus:border-[#B5121B]"
                    >
                      <option value="upsert">Create and Update (Upsert - Recommended)</option>
                      <option value="create_only">Create New Products Only (Skip existing SKUs)</option>
                      <option value="update_only">Update Existing Products Only (Skip new SKUs)</option>
                      <option value="skip_duplicates">Skip Duplicate SKUs (Create novel items)</option>
                    </select>
                    <p className="text-[11px] text-gray-500">
                      Determines how the importer resolves existing product SKUs found in the catalog.
                    </p>
                  </div>

                  {/* Preserve Blank Fields Toggle */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-700">Blank Cell Handling</label>
                    <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-gray-800">Preserve existing values on blank cells</span>
                      <input
                        type="checkbox"
                        checked={preserveBlankFields}
                        onChange={(e) => setPreserveBlankFields(e.target.checked)}
                        className="w-4 h-4 text-[#B5121B] rounded focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Keeps existing photos, prices, descriptions, and published status when the corresponding Excel cell is blank.
                    </p>
                  </div>
                </div>

                {/* Safety Defaults Callout */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-950">Enterprise Safety Defaults</p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      All new products default to <strong>Unpublished (Draft)</strong> and <strong>Hidden Price (Price on Request)</strong>, with Image Status set to <strong>Pending</strong>. This prevents unverified pricing or placeholder photos from being exposed publicly.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION TABLE */}
          {currentStep === 'preview' && validationSummary && (
            <div className="space-y-5">
              
              {/* Validation Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Rows</span>
                  <div className="text-xl font-black text-gray-900">{validationSummary.totalRows}</div>
                  <span className="text-[10px] text-gray-500">{selectedFile?.name}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Ready to Import</span>
                  <div className="text-xl font-black text-emerald-700">{validationSummary.validRows}</div>
                  <span className="text-[10px] text-emerald-600">Passed checks</span>
                </div>

                <div className={`rounded-xl p-3 space-y-0.5 border ${validationSummary.errorRows > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${validationSummary.errorRows > 0 ? 'text-red-800' : 'text-gray-500'}`}>
                    Blocking Errors
                  </span>
                  <div className={`text-xl font-black ${validationSummary.errorRows > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {validationSummary.errorRows}
                  </div>
                  <span className="text-[10px] text-gray-500">Requires correction</span>
                </div>

                <div className={`rounded-xl p-3 space-y-0.5 border ${validationSummary.warningRows > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${validationSummary.warningRows > 0 ? 'text-amber-800' : 'text-gray-500'}`}>
                    Warnings
                  </span>
                  <div className={`text-xl font-black ${validationSummary.warningRows > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                    {validationSummary.warningRows}
                  </div>
                  <span className="text-[10px] text-gray-500">Non-blocking defaults</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">New Equipment</span>
                  <div className="text-xl font-black text-blue-700">{validationSummary.newRows}</div>
                  <span className="text-[10px] text-blue-600">Novel SKUs</span>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Updates</span>
                  <div className="text-xl font-black text-purple-700">{validationSummary.updateRows}</div>
                  <span className="text-[10px] text-purple-600">Existing SKUs</span>
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
                
                {/* Search in preview */}
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search preview by SKU, title, brand..."
                      value={previewSearch}
                      onChange={(e) => {
                        setPreviewSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#B5121B]"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                  <button
                    onClick={() => { setTableFilter('all'); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      tableFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => { setTableFilter('valid'); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      tableFilter === 'valid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Valid ({validationSummary.validRows})
                  </button>
                  {validationSummary.errorRows > 0 && (
                    <button
                      onClick={() => { setTableFilter('errors'); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        tableFilter === 'errors' ? 'bg-white text-red-800 shadow-2xs' : 'text-red-700 hover:text-red-900'
                      }`}
                    >
                      Errors ({validationSummary.errorRows})
                    </button>
                  )}
                  {validationSummary.warningRows > 0 && (
                    <button
                      onClick={() => { setTableFilter('warnings'); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        tableFilter === 'warnings' ? 'bg-white text-amber-800 shadow-2xs' : 'text-amber-700 hover:text-amber-900'
                      }`}
                    >
                      Warnings ({validationSummary.warningRows})
                    </button>
                  )}
                  <button
                    onClick={() => { setTableFilter('new'); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      tableFilter === 'new' ? 'bg-white text-blue-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    New ({validationSummary.newRows})
                  </button>
                  <button
                    onClick={() => { setTableFilter('updates'); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      tableFilter === 'updates' ? 'bg-white text-purple-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Updates ({validationSummary.updateRows})
                  </button>
                </div>

                {/* Download Error Report if there are errors or warnings */}
                {(validationSummary.errorRows > 0 || validationSummary.warningRows > 0) && (
                  <button
                    onClick={handleDownloadErrorReport}
                    disabled={generatingErrorReport}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Download Excel spreadsheet with row-by-row error details"
                  >
                    <Download className="w-3.5 h-3.5 text-red-600" />
                    <span>{generatingErrorReport ? 'Exporting...' : 'Download Error Report (.xlsx)'}</span>
                  </button>
                )}
              </div>

              {/* High-Performance Paginated Preview Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#292F36] text-white sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Row</th>
                        <th className="py-2.5 px-3 w-20 text-center">Status</th>
                        <th className="py-2.5 px-3 w-24">Action</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name & Model</th>
                        <th className="py-2.5 px-3">Brand</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Price (PHP)</th>
                        <th className="py-2.5 px-3 text-center">Stock</th>
                        <th className="py-2.5 px-3 text-center">Publish</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Validation Notes & Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-gray-500">
                            No rows match your current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row) => (
                          <tr 
                            key={row.rowNumber}
                            className={`hover:bg-gray-50/70 transition-colors ${
                              row.status === 'error' ? 'bg-red-50/20' : (row.status === 'warning' ? 'bg-amber-50/20' : '')
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-gray-400 text-[11px]">
                              {row.rowNumber}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              {row.status === 'valid' ? (
                                <span className="inline-flex items-center text-emerald-700" title="Valid">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : row.status === 'warning' ? (
                                <span className="inline-flex items-center text-amber-600" title="Warning">
                                  <AlertTriangle className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-600" title="Error">
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {row.isExisting ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                  Update
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  New Item
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                              {row.sku || <span className="text-red-500 italic">Missing SKU</span>}
                            </td>

                            <td className="py-2.5 px-3">
                              <div className="font-bold text-gray-900 line-clamp-1">{row.name}</div>
                              <div className="text-[11px] font-mono text-gray-500">Model: {row.model}</div>
                            </td>

                            <td className="py-2.5 px-3 font-medium text-gray-800">
                              {row.brand}
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-medium text-gray-700">{row.categoryName || '—'}</span>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                              {row.pricePhp !== undefined ? `₱${row.pricePhp.toLocaleString()}` : <span className="text-gray-400 font-normal">Hidden</span>}
                            </td>

                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className="text-[11px] font-medium text-gray-700">
                                {row.stockStatus}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                row.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {row.isPublished ? 'Live' : 'Draft'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
                              {row.errors.length > 0 ? (
                                <div className="space-y-0.5">
                                  {row.errors.map((err, i) => (
                                    <div key={i} className="text-[11px] text-red-700 flex items-start gap-1 font-medium">
                                      <span className="shrink-0">•</span>
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : row.warnings.length > 0 ? (
                                <div className="space-y-0.5">
                                  {row.warnings.map((w, i) => (
                                    <div key={i} className="text-[11px] text-amber-700 flex items-start gap-1">
                                      <span className="shrink-0">•</span>
                                      <span>{w}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Ready</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Showing {Math.min(filteredRows.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredRows.length, currentPage * pageSize)} of {filteredRows.length} items</span>
                    <span>·</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="p-1 bg-white border border-gray-300 rounded text-xs font-semibold"
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: IMPORTING PROGRESS */}
          {currentStep === 'importing' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#B5121B] shadow-md">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900">Executing Catalog Bulk Import</h3>
                <p className="text-xs text-gray-500">{importProgress.message}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-[#B5121B] h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>Processed: {importProgress.current} / {importProgress.total}</span>
                  <span>{Math.min(100, Math.round((importProgress.current / Math.max(1, importProgress.total)) * 100))}%</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                Operating with transactional safety in controlled chunks. Do not close your browser tab.
              </p>
            </div>
          )}

          {/* STEP 4: IMPORT EXECUTION SUMMARY */}
          {currentStep === 'summary' && importSummary && (
            <div className="space-y-6 max-w-4xl mx-auto py-4">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                  importSummary.failedCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {importSummary.failedCount === 0 ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <AlertTriangle className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    {importSummary.failedCount === 0 ? 'Bulk Import Completed Successfully' : 'Import Finished with Warnings'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Executed in {(importSummary.durationMs / 1000).toFixed(1)} seconds in <strong>{importSummary.mode}</strong> mode.
                  </p>
                </div>

                {/* Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Created</span>
                    <div className="text-2xl font-black text-emerald-700">{importSummary.createdCount}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Updated</span>
                    <div className="text-2xl font-black text-purple-700">{importSummary.updatedCount}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Skipped</span>
                    <div className="text-2xl font-black text-gray-700">{importSummary.skippedCount}</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Failed</span>
                    <div className="text-2xl font-black text-red-700">{importSummary.failedCount}</div>
                  </div>
                </div>
              </div>

              {/* Execution Audit Log */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-800 uppercase tracking-wider">
                    Execution Audit Trail ({importSummary.results.length} items logged)
                  </span>
                  <span className="text-[11px] text-gray-500">{new Date(importSummary.timestamp).toLocaleString()}</span>
                </div>

                <div className="overflow-y-auto max-h-[30vh] divide-y divide-gray-100 text-xs">
                  {importSummary.results.map((res, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          res.action === 'created' ? 'bg-emerald-100 text-emerald-800' :
                          res.action === 'updated' ? 'bg-purple-100 text-purple-800' :
                          res.action === 'skipped' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {res.action}
                        </span>
                        <span className="font-mono font-bold text-gray-900">{res.sku}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-700 line-clamp-1">{res.name}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 shrink-0">{res.message}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep === 'preview' && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                ← Upload Different File
              </button>
            )}
            {currentStep === 'upload' && (
              <span className="text-[11px] text-gray-500">
                Logged in as <strong className="text-gray-700">{adminUser?.email || 'Administrator'}</strong> ({adminUser?.role || 'admin'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {currentStep === 'summary' ? 'Done / Close' : 'Cancel'}
            </button>

            {currentStep === 'preview' && validationSummary && (
              <>
                {validationSummary.errorRows > 0 ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={validationSummary.validRows === 0}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Skip Errors & Import {validationSummary.validRows} Valid Rows</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={validationSummary.validRows === 0}
                    className="px-5 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Execute Import ({validationSummary.validRows} Items)</span>
                  </button>
                )}
              </>
            )}

            {currentStep === 'summary' && (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#B5121B] hover:bg-[#8F1018] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                View Catalog in Dashboard
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && validationSummary && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#B5121B] mx-auto shadow-xs">
              <Package className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-gray-900">Confirm Product Catalog Import</h3>
              <p className="text-xs text-gray-500">
                You are about to batch import products into the ZEZ Automation database.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Target Mode:</span>
                <span className="font-mono font-bold text-gray-900 uppercase">{importMode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">New Items to Create:</span>
                <span className="font-bold text-blue-700">{validationSummary.newRows} novel SKUs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Existing Items to Update:</span>
                <span className="font-bold text-purple-700">{validationSummary.updateRows} catalog SKUs</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Preserve Existing Blank Values:</span>
                <span className="font-bold text-emerald-700">{preserveBlankFields ? 'Yes (Safe)' : 'No'}</span>
              </div>
            </div>

            {validationSummary.errorRows > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Notice: <strong>{validationSummary.errorRows} rows</strong> with validation errors will be safely omitted. Only the <strong>{validationSummary.validRows} valid rows</strong> will be imported.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Back to Preview
              </button>
              <button
                type="button"
                onClick={() => handleStartImport(validationSummary.errorRows > 0)}
                className="w-1/2 py-2.5 bg-[#B5121B] hover:bg-[#8F1018] text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Proceed with Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
