import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Link as LinkIcon, Copy, Eye, Clock, Zap, ArrowRight, Check, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NomineeAccessCard({ nominee, onUpdate, onEdit, onDelete, onMovePriority, isFirst, isLast, index }) {
  const [generating, setGenerating] = useState(false);
  const [accessLink, setAccessLink] = useState(null);
  const [showLink, setShowLink] = useState(false);

  const generateAccess = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API}/nominees/${nominee.id}/generate-access`, {}, { withCredentials: true });
      setAccessLink(response.data.access_link);
      setShowLink(true);
      toast.success('Access link generated! Copy and share it securely.');
      onUpdate();
    } catch (error) {
      console.error('Failed to generate access:', error);
      toast.error('Failed to generate access');
    } finally {
      setGenerating(false);
    }
  };

  const revokeAccess = async (skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Revoke access for ${nominee.name}? They will no longer be able to view your portfolio.`)) return;
    
    try {
      await axios.post(`${API}/nominees/${nominee.id}/revoke-access`, {}, { withCredentials: true });
      if (!skipConfirm) {
        toast.success('Access revoked');
      }
      setAccessLink(null);
      setShowLink(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      if (!skipConfirm) {
        toast.error('Failed to revoke access');
      }
    }
  };

  const updateAccessType = async (type) => {
    try {
      await axios.put(`${API}/nominees/${nominee.id}/access-type?access_type=${type}`, {}, { withCredentials: true });
      
      // Auto-grant access for immediate, auto-revoke for after_dms
      if (type === 'immediate' && !nominee.access_granted) {
        // Generate access automatically
        await generateAccess();
        toast.success('Access type set to Immediate - Access granted automatically!');
      } else if (type === 'after_dms' && nominee.access_granted) {
        // Revoke access automatically
        await revokeAccess(true); // Pass true to skip confirmation
        toast.success('Access type set to After DMS - Access revoked until DMS triggers');
      } else if (type === 'temporary') {
        // Generate temporary 7-day access
        if (!nominee.access_granted) {
          await generateAccess();
        }
        toast.success('Temporary access granted for 7 days');
      } else {
        toast.success(`Access type updated to: ${type}`);
      }
      
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
    <div className="p-5 rounded-lg space-y-4 relative" style={{background: '#16001e', border: '2px solid #2d1f3d'}}>
      {/* Priority Badge & Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{background: '#2d0e3e', color: '#a855f7'}}>
          #{index + 1}
        </div>
        <div className="flex flex-col gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMovePriority(nominee.id, 'up')}
            disabled={isFirst}
            style={{height: '20px', width: '32px', padding: 0, opacity: isFirst ? 0.3 : 1}}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMovePriority(nominee.id, 'down')}
            disabled={isLast}
            style={{height: '20px', width: '32px', padding: 0, opacity: isLast ? 0.3 : 1}}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Edit & Delete Controls */}
      <div className="absolute top-3 right-3 flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(nominee)}
          style={{
            height: '32px',
            padding: '0 0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6'
          }}
        >
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(nominee.id)}
          style={{
            height: '32px',
            padding: '0 0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444'
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Nominee Info */}
      <div className="pt-8 pl-12">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="font-bold text-xl" style={{color: '#f8fafc'}}>{nominee.name}</p>
              {nominee.access_granted && (
                <div className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#10b981'}}>
                  <Check className="w-3 h-3" />
                  ACCESS GRANTED
                </div>
              )}
            </div>
            <p className="text-sm mb-1" style={{color: '#cbd5e1'}}>{nominee.email}</p>
            {nominee.phone && (
              <p className="text-sm" style={{color: '#94a3b8'}}>{nominee.phone}</p>
            )}
            <div className="flex gap-2 mt-2">
              {nominee.relationship && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7'}}>
                  {nominee.relationship}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Access Type Selection */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-3" style={{color: '#E8C27C'}}>⚙️ When can they access your portfolio?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateAccessType('immediate')}
              className="p-4 rounded-lg text-left transition-all hover:scale-105"
              style={{
                background: nominee.access_type === 'immediate' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${nominee.access_type === 'immediate' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              <Zap className="w-6 h-6 mb-2" style={{color: nominee.access_type === 'immediate' ? '#a855f7' : '#64748b'}} />
              <p className="text-sm font-bold" style={{color: nominee.access_type === 'immediate' ? '#f8fafc' : '#94a3b8'}}>
                Immediate Access
              </p>
              <p className="text-xs" style={{color: '#64748b'}}>They can view right now</p>
            </button>

            <button
              onClick={() => updateAccessType('after_dms')}
              className="p-4 rounded-lg text-left transition-all hover:scale-105"
              style={{
                background: nominee.access_type === 'after_dms' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${nominee.access_type === 'after_dms' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`
              }}
            >
              <Clock className="w-6 h-6 mb-2" style={{color: nominee.access_type === 'after_dms' ? '#a855f7' : '#64748b'}} />
              <p className="text-sm font-bold" style={{color: nominee.access_type === 'after_dms' ? '#f8fafc' : '#94a3b8'}}>
                After Dead Man's Switch
              </p>
              <p className="text-xs" style={{color: '#64748b'}}>Only if you're inactive</p>
            </button>
          </div>
        </div>

        {/* Generate/Revoke Access - Enhanced CTA */}
        <div className="space-y-3">
          {!nominee.access_granted ? (
            <div className="p-6 rounded-lg text-center" style={{background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '2px solid rgba(16, 185, 129, 0.3)'}}>
              <Shield className="w-12 h-12 mx-auto mb-3" style={{color: '#10b981'}} />
              <p className="text-sm font-semibold mb-2" style={{color: '#f8fafc'}}>Ready to Grant Access?</p>
              <p className="text-xs mb-4" style={{color: '#94a3b8'}}>
                Generate a secure access link that {nominee.name} can use to view your portfolio
              </p>
              <Button 
                onClick={generateAccess}
                disabled={generating}
                className="w-full"
                style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 700}}
              >
                <Shield className="w-4 h-4 mr-2" />
                {generating ? 'Generating Secure Link...' : 'Generate Access Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{color: '#10b981'}} />
                    <p className="text-sm font-bold" style={{color: '#10b981'}}>ACCESS ACTIVE</p>
                  </div>
                  {nominee.last_accessed_at && (
                    <p className="text-xs" style={{color: '#64748b'}}>
                      Last viewed: {new Date(nominee.last_accessed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {showLink && accessLink && (
                  <div className="mb-3 p-3 rounded" style={{background: 'rgba(0,0,0,0.2)'}}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold mb-1" style={{color: '#10b981'}}>SECURE LINK</p>
                        <p className="text-xs truncate font-mono" style={{color: '#cbd5e1'}}>
                          {accessLink}
                        </p>
                      </div>
                      <Button size="sm" onClick={copyLink} style={{background: '#10b981', color: '#fff', padding: '0.5rem'}}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={generateAccess}
                    size="sm"
                    className="flex-1"
                    variant="outline"
                    style={{borderColor: '#10b981', color: '#10b981', fontSize: '0.813rem'}}
                  >
                    <LinkIcon className="w-3 h-3 mr-2" />
                    {showLink ? 'Regenerate' : 'Show'} Link
                  </Button>
                  <Button 
                    onClick={revokeAccess}
                    size="sm"
                    style={{background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.813rem'}}
                  >
                    Revoke Access
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
