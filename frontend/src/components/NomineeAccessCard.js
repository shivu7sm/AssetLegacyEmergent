import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Link as LinkIcon, Copy, Eye, Clock, Zap, ArrowRight, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NomineeAccessCard({ nominee, onUpdate }) {
  const [generating, setGenerating] = useState(false);
  const [accessLink, setAccessLink] = useState(null);

  const generateAccess = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/nominees/${nominee.id}/generate-access`, {}, { withCredentials: true });
      setAccessLink(response.data.access_link);
      toast.success('Access link generated!');
      onUpdate();
    } catch (error) {
      console.error('Failed to generate access:', error);
      toast.error('Failed to generate access');
    } finally {
      setGenerating(false);
    }
  };

  const revokeAccess = async () => {
    if (!window.confirm(`Revoke access for ${nominee.name}? They will no longer be able to view your portfolio.`)) return;
    
    try {
      await axios.post(`${API}/nominees/${nominee.id}/revoke-access`, {}, { withCredentials: true });
      toast.success('Access revoked');
      setAccessLink(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const updateAccessType = async (type) => {
    try {
      await axios.put(`${API}/nominees/${nominee.id}/access-type?access_type=${type}`, {}, { withCredentials: true });
      toast.success(`Access type updated to: ${type === 'immediate' ? 'Immediate' : 'After DMS'}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to update access type:', error);
      toast.error('Failed to update access type');
    }
  };

  const copyLink = () => {
    if (accessLink) {
      navigator.clipboard.writeText(accessLink);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="p-4 rounded-lg space-y-4" style={{background: '#16001e', border: '1px solid #2d1f3d'}}>
      {/* Nominee Info */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-lg" style={{color: '#f8fafc'}}>{nominee.name}</p>
          <p className="text-sm" style={{color: '#94a3b8'}}>{nominee.email}</p>
          <p className="text-xs mt-1" style={{color: '#64748b'}}>
            {nominee.relationship} • Priority {nominee.priority}
          </p>
        </div>
        {nominee.access_granted && (
          <div className="px-3 py-1 rounded-full text-xs font-bold" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>
            <Check className="w-3 h-3 inline mr-1" />
            ACCESS GRANTED
          </div>
        )}
      </div>

      {/* Access Type Selection */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{color: '#cbd5e1'}}>When can they access your portfolio?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateAccessType('immediate')}
            className="p-3 rounded-lg text-left transition-all"
            style={{
              background: nominee.access_type === 'immediate' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${nominee.access_type === 'immediate' ? '#a855f7' : 'transparent'}`
            }}
          >
            <Zap className="w-5 h-5 mb-2" style={{color: nominee.access_type === 'immediate' ? '#a855f7' : '#64748b'}} />
            <p className="text-sm font-semibold" style={{color: nominee.access_type === 'immediate' ? '#f8fafc' : '#94a3b8'}}>
              Immediate
            </p>
            <p className="text-xs" style={{color: '#64748b'}}>Right now</p>
          </button>

          <button
            onClick={() => updateAccessType('after_dms')}
            className="p-3 rounded-lg text-left transition-all"
            style={{
              background: nominee.access_type === 'after_dms' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${nominee.access_type === 'after_dms' ? '#a855f7' : 'transparent'}`
            }}
          >
            <Clock className="w-5 h-5 mb-2" style={{color: nominee.access_type === 'after_dms' ? '#a855f7' : '#64748b'}} />
            <p className="text-sm font-semibold" style={{color: nominee.access_type === 'after_dms' ? '#f8fafc' : '#94a3b8'}}>
              After DMS
            </p>
            <p className="text-xs" style={{color: '#64748b'}}>Only if inactive</p>
          </button>
        </div>
      </div>

      {/* Generate/Revoke Access */}
      <div className="flex gap-3">
        {!nominee.access_granted ? (
          <Button 
            onClick={generateAccess}
            disabled={generating}
            className="flex-1"
            style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff'}}
          >
            <Shield className="w-4 h-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Access Link'}
          </Button>
        ) : (
          <>
            <Button 
              onClick={generateAccess}
              className="flex-1"
              variant="outline"
              style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Regenerate Link
            </Button>
            <Button 
              onClick={revokeAccess}
              variant="outline"
              style={{borderColor: '#ef4444', color: '#ef4444'}}
            >
              Revoke Access
            </Button>
          </>
        )}
      </div>

      {/* Access Link Display */}
      {(accessLink || nominee.access_granted) && (
        <div className="p-3 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold mb-1" style={{color: '#10b981'}}>ACCESS LINK</p>
              <p className="text-xs truncate" style={{color: '#cbd5e1'}}>
                {accessLink || 'Link generated (check email)'}
              </p>
            </div>
            {accessLink && (
              <Button size="sm" onClick={copyLink} style={{background: '#10b981', color: '#fff'}}>
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {nominee.last_accessed_at && (
        <p className="text-xs" style={{color: '#64748b'}}>
          Last accessed: {new Date(nominee.last_accessed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
