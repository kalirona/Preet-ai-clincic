import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  File, 
  Trash2, 
  UploadCloud, 
  Download, 
  Camera, 
  Loader2, 
  Calendar, 
  X, 
  CreditCard, 
  User,
  ExternalLink
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { CRMRecord } from "@/pages/Clients";
import { getActivePlanLimits, getCurrentUsage } from "@/utils/limits";

interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  createdAt: string;
}

interface ClientDetailDialogProps {
  client: CRMRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: CRMRecord) => void;
  workspaceId: string;
}

export function ClientDetailDialog({ 
  client, 
  isOpen, 
  onClose, 
  onUpdateClient,
  workspaceId 
}: ClientDetailDialogProps) {
  if (!client) return null;

  const [activeTab, setActiveTab] = useState<"info" | "documents" | "invoices" | "attachments">("info");
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  
  // Upload states
  const [uploading, setUploading] = useState<boolean>(false);
  const [profileUploading, setProfileUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch client files when open
  useEffect(() => {
    if (isOpen && client) {
      fetchClientDocuments();
      setActiveTab("info");
    }
  }, [isOpen, client]);

  const fetchClientDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/storage/documents?clientId=${client.id}`, {
        headers: {
          "x-workspace-id": workspaceId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDocumentsList(data);
      }
    } catch (err) {
      console.error("Error loading client documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Drag and Drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    // Plan limits storage verification
    const planLimits = getActivePlanLimits();
    const usage = getCurrentUsage();
    // In our simulation, we estimate each uploaded file adds 1.5 MB of storage
    const estimatedNewStorage = usage.storage + (files.length * 1.5);
    
    if (estimatedNewStorage > planLimits.storage) {
      toast.error('Subscription Storage Limit Exhausted', {
        description: `Your active ${planLimits.name} tier limits you to ${planLimits.storage} MB of storage. This upload of ${files.length} file(s) would exceed your limit (${estimatedNewStorage.toFixed(1)} MB required). Please upgrade your settings inside the active Billing Tab.`
      });
      return;
    }

    try {
      setUploading(true);
      // Map tabs to backend categories
      let category = "document";
      if (activeTab === "invoices") category = "invoice";
      if (activeTab === "attachments") category = "attachment";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", String(client.id));
        formData.append("category", category);

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          headers: {
            "x-workspace-id": workspaceId
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error("Failed to upload " + file.name);
        }

        // Increment local simulated attachments count for limits tracking
        const currentCount = parseInt(localStorage.getItem('preet_attachments_count') || '1', 10);
        localStorage.setItem('preet_attachments_count', (currentCount + 1).toString());

        toast.success(`Uploaded: ${file.name}`);
      }

      // Reload files
      await fetchClientDocuments();
    } catch (err: any) {
      toast.error(err.message || "Error uploading file(s)");
    } finally {
      setUploading(false);
    }
  };

  // Avatar profile image upload
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setProfileUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", String(client.id));
        formData.append("category", "profile_photo");

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          headers: {
            "x-workspace-id": workspaceId
          },
          body: formData
        });

        if (response.ok) {
          const resData = await response.json();
          const publicUrl = resData.document.fileUrl;
          
          // Trigger parent component state update to persist CRM record changes
          const updatedClient = {
            ...client,
            profilePhotoUrl: publicUrl
          };
          onUpdateClient(updatedClient);
          toast.success("Profile photo updated successfully!");
        } else {
          throw new Error("Failed file pipeline upload");
        }
      } catch (err: any) {
        toast.error(err.message || "Error assigning profile avatar.");
      } finally {
        setProfileUploading(false);
      }
    }
  };

  // File Delete
  const handleDeleteDocument = async (docId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`/api/storage/documents/${docId}`, {
        method: "DELETE",
        headers: {
          "x-workspace-id": workspaceId
        }
      });

      if (res.ok) {
        toast.success(`Removed File: ${name}`);
        setDocumentsList(prev => prev.filter(d => d.id !== docId));
      } else {
        throw new Error("Delete operation rejected.");
      }
    } catch (err) {
      toast.error("Could not remove document records");
    }
  };

  // Render appropriate file type icon
  const getFileIcon = (mime?: string) => {
    if (!mime) return <File className="w-5 h-5 text-slate-400" />;
    if (mime.includes("image")) return <FileImage className="w-5 h-5 text-emerald-500" />;
    if (mime.includes("pdf")) return <FileText className="w-5 h-5 text-rose-500" />;
    if (mime.includes("excel") || mime.includes("sheet") || mime.includes("csv")) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-indigo-500" />;
  };

  const getFilteredDocs = () => {
    if (activeTab === "documents") {
      return documentsList.filter(d => d.category === "document");
    }
    if (activeTab === "invoices") {
      return documentsList.filter(d => d.category === "invoice");
    }
    if (activeTab === "attachments") {
      return documentsList.filter(d => d.category === "attachment");
    }
    return [];
  };

  const displayedDocs = getFilteredDocs();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id="client-detail-document-panel" className="max-w-[700px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Banner Block with Client Overview */}
        <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-6 flex flex-col sm:flex-row items-center gap-4 relative">
          
          {/* Avatar Area with Trigger */}
          <div className="relative group shrink-0 select-none">
            <Avatar className="w-20 h-20 border-2 border-white shadow-md rounded-2xl bg-slate-100 overflow-hidden">
              {client.profilePhotoUrl ? (
                <AvatarImage src={client.profilePhotoUrl} className="object-cover w-full h-full" />
              ) : null}
              <AvatarFallback className="text-xl font-bold bg-indigo-500 text-white select-none">
                {client.name ? client.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "C"}
              </AvatarFallback>
            </Avatar>

            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold rounded-2xl cursor-pointer"
            >
              {profileUploading ? (
                <Loader2 className="w-4 h-4 animate-spin mb-1" />
              ) : (
                <Camera className="w-4 h-4 mb-1 text-slate-100" />
              )}
              <span>Update Photo</span>
            </button>
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* User Bio Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                {client.name}
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase border-slate-200">
                  {client.type}
                </Badge>
                <Badge className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 border-indigo-150">
                  {client.stage}
                </Badge>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 font-medium mt-1">
              Contact Email: {client.email || "No email"}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-none mt-1">
              Financial Estimate: <span className="font-bold text-slate-800">${(client.value || 0).toLocaleString()}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-[#fafafb]/50 px-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold transition-all border-b-2 hover:text-slate-900 cursor-pointer ${
              activeTab === "info" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-400"
            }`}
          >
            Overview Info
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold transition-all border-b-2 hover:text-slate-900 cursor-pointer ${
              activeTab === "documents" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-400"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold transition-all border-b-2 hover:text-slate-900 cursor-pointer ${
              activeTab === "invoices" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-400"
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold transition-all border-b-2 hover:text-slate-900 cursor-pointer ${
              activeTab === "attachments" 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-400"
            }`}
          >
            Attachments
          </button>
        </div>

        {/* Screen/Tab Body Content Area */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[50vh]">
          {activeTab === "info" ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CRM Record Notes</span>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-700 leading-normal">
                  {client.notes || "No notes aggregated yet."}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Associated Tag</span>
                  <Badge variant="outline" className="text-[11px] py-1 px-3 bg-white font-medium text-slate-700 border-slate-200">
                    {client.serviceTag || "None"}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Last Meeting / Appointment</span>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{client.lastAppointment || "Pending Booking"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Drag and Drop Zone Container */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-indigo-600 bg-indigo-50/30" 
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  multiple 
                  className="hidden" 
                />
                
                {uploading ? (
                  <div className="flex flex-col items-center py-2 text-slate-600">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">Uploading files into cloud workspace...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center select-none py-2">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2 transition-transform group-hover:scale-105" />
                    <p className="text-xs text-slate-700 font-bold">
                      Drag & Drop files here, or <span className="text-indigo-600 hover:underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Supports PDF, images, Excel sheets, invoices up to 25MB
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#a0aec0] mb-2">
                  Stored {activeTab} Records ({displayedDocs.length})
                </h3>

                {loadingDocs ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  </div>
                ) : displayedDocs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/30 border border-slate-100 rounded-xl">
                    <File className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No {activeTab} files logged for this CRM record.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white hover:border-slate-200 shadow-3xs hover:shadow-2xs transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100/75 shrink-0 transition-all">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                              {doc.name}
                            </p>
                            <p className="text-[10px] text-slate-400 leading-none mt-1 font-semibold">
                              {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) : "0")} KB • {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Open / Download */}
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                            title="Open file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button 
                            onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-slate-100 bg-[#fafafb]/50 shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer">
            Close Panel
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
