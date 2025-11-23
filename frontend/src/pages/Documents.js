import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('all');
  const [storageInfo, setStorageInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null,
    share_with_nominee: false,
    linked_asset_id: null
  });

  useEffect(() => {
    fetchDocuments();
    fetchAssets();
    fetchStorageInfo();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API}/documents`, { withCredentials: true });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API}/assets`, { withCredentials: true });
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchStorageInfo = async () => {
    try {
      const response = await axios.get(`${API}/subscription/current`, { withCredentials: true });
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch storage info:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, file, name: formData.name || file.name });
    }
  };

  const handleUpload = async () => {
    if (!formData.file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        
        await axios.post(`${API}/documents`, {
          name: formData.name,
          description: formData.description,
          file_type: formData.file.type,
          file_data: base64,
          file_size: formData.file.size,
          tags: [],
          share_with_nominee: formData.share_with_nominee,
          linked_asset_id: formData.linked_asset_id
        }, { withCredentials: true });

        toast.success('Document uploaded successfully');
        setDialogOpen(false);
        setFormData({ name: '', description: '', file: null, share_with_nominee: false, linked_asset_id: null });
        fetchDocuments();
        fetchStorageInfo();
      };
      reader.readAsDataURL(formData.file);
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const response = await axios.get(`${API}/documents/${docId}`, { withCredentials: true });
      const blob = await fetch(`data:${response.data.file_type};base64,${response.data.file_data}`).then(r => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`${API}/documents/${docId}`, { withCredentials: true });
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-xl" style={{color: '#94a3b8'}}>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
              Document Vault
            </h1>
            <p style={{color: '#94a3b8'}}>Store important documents securely for your family</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-white" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
              <DialogHeader>
                <DialogTitle style={{color: '#f8fafc'}}>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Document Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Passport, Will, Insurance Policy..."
                    style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Description (optional)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details"
                    style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Link to Asset (optional)</Label>
                  <select
                    value={formData.linked_asset_id || ''}
                    onChange={(e) => setFormData({ ...formData, linked_asset_id: e.target.value || null })}
                    className="w-full p-2 rounded-md"
                    style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc', border: '1px solid'}}
                  >
                    <option value="">-- No Asset --</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs mt-1" style={{color: '#64748b'}}>Link this document to a specific asset for better organization</p>
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>File (Max 10MB)</Label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    style={{background: '#0f0a1e', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.share_with_nominee}
                    onChange={(e) => setFormData({ ...formData, share_with_nominee: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label style={{color: '#94a3b8'}}>Share with nominee when dead man switch activates</Label>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full text-white"
                  style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {documents.length === 0 ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4" style={{color: '#2d1f3d'}} />
              <h3 className="text-xl font-semibold mb-2" style={{color: '#f8fafc'}}>No documents yet</h3>
              <p className="mb-6" style={{color: '#94a3b8'}}>Upload important documents to keep them safe and accessible</p>
              <Button onClick={() => setDialogOpen(true)} className="text-white" style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'}}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8" style={{color: '#ec4899'}} />
                      <div>
                        <CardTitle style={{color: '#f8fafc', fontSize: '1rem'}}>{doc.name}</CardTitle>
                        <p className="text-xs mt-1" style={{color: '#94a3b8'}}>{formatFileSize(doc.file_size)}</p>
                      </div>
                    </div>
                    {doc.share_with_nominee && (
                      <Shield className="w-5 h-5" style={{color: '#22c55e'}} title="Shared with nominee" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {doc.description && (
                    <p className="text-sm mb-4" style={{color: '#94a3b8'}}>{doc.description}</p>
                  )}
                  <div className="text-xs mb-4" style={{color: '#64748b'}}>
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(doc.id, doc.name)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleDelete(doc.id)}
                      variant="outline"
                      size="sm"
                      style={{borderColor: '#ef4444', color: '#ef4444'}}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
