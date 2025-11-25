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
    <div className="p-5 rounded-lg space-y-4 relative" style={{background: 'linear-gradient(135deg, #1a1229 0%, #16001e 100%)', border: '2px solid #2d1f3d', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
      {/* Priority Controls - Enhanced */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
          style={{background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)'}}
        >
          #{index + 1}
        </div>
        <div className="flex flex-col">
          <Button
            size="sm"
            onClick={() => onMovePriority(nominee.id, 'up')}
            disabled={isFirst}
            style={{
              height: '24px', 
              width: '36px', 
              padding: 0,
              background: isFirst ? 'rgba(255,255,255,0.05)' : 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: isFirst ? '#64748b' : '#a855f7',
              marginBottom: '2px'
            }}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => onMovePriority(nominee.id, 'down')}
            disabled={isLast}
            style={{
              height: '24px', 
              width: '36px', 
              padding: 0,
              background: isLast ? 'rgba(255,255,255,0.05)' : 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: isLast ? '#64748b' : '#a855f7'
            }}
          >
            <ChevronDown className="w-4 h-4" />
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

        {/* Access Type Selection - 3 Options in Single Row */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{color: '#E8C27C'}}>
            <Shield className="w-4 h-4" />
            Access Permissions
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* Immediate Access */}
            <button
              onClick={() => updateAccessType('immediate')}
              className="p-4 rounded-lg text-center transition-all hover:scale-105"
              style={{
                background: nominee.access_type === 'immediate' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${nominee.access_type === 'immediate' ? '#a855f7' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: nominee.access_type === 'immediate' ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none'
              }}
            >
              <Zap className="w-7 h-7 mx-auto mb-2" style={{color: nominee.access_type === 'immediate' ? '#a855f7' : '#64748b'}} />
              <p className="text-sm font-bold mb-1" style={{color: nominee.access_type === 'immediate' ? '#f8fafc' : '#94a3b8'}}>
                Immediate
              </p>
              <p className="text-xs leading-tight" style={{color: '#64748b'}}>
                Access right now<br/>
                {nominee.access_type === 'immediate' && <span style={{color: '#10b981'}}>✓ Auto-granted</span>}
              </p>
            </button>

            {/* Temporary Access */}
            <button
              onClick={() => updateAccessType('temporary')}
              className="p-4 rounded-lg text-center transition-all hover:scale-105"
              style={{
                background: nominee.access_type === 'temporary' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${nominee.access_type === 'temporary' ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: nominee.access_type === 'temporary' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <Clock className="w-7 h-7 mx-auto mb-2" style={{color: nominee.access_type === 'temporary' ? '#f59e0b' : '#64748b'}} />
              <p className="text-sm font-bold mb-1" style={{color: nominee.access_type === 'temporary' ? '#f8fafc' : '#94a3b8'}}>
                Temporary
              </p>
              <p className="text-xs leading-tight" style={{color: '#64748b'}}>
                7-day access<br/>
                {nominee.access_type === 'temporary' && <span style={{color: '#f59e0b'}}>⏰ Limited time</span>}
              </p>
            </button>

            {/* After DMS */}
            <button
              onClick={() => updateAccessType('after_dms')}
              className="p-4 rounded-lg text-center transition-all hover:scale-105"
              style={{
                background: nominee.access_type === 'after_dms' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${nominee.access_type === 'after_dms' ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: nominee.access_type === 'after_dms' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <Shield className="w-7 h-7 mx-auto mb-2" style={{color: nominee.access_type === 'after_dms' ? '#3b82f6' : '#64748b'}} />
              <p className="text-sm font-bold mb-1" style={{color: nominee.access_type === 'after_dms' ? '#f8fafc' : '#94a3b8'}}>
                After DMS
              </p>
              <p className="text-xs leading-tight" style={{color: '#64748b'}}>
                Only if inactive<br/>
                {nominee.access_type === 'after_dms' && <span style={{color: '#3b82f6'}}>🛡️ Safeguarded</span>}
              </p>
            </button>
          </div>
          
          {/* Explanation Text */}
          <div className="mt-3 p-3 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.05)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
            <p className="text-xs" style={{color: '#cbd5e1'}}>
              {nominee.access_type === 'immediate' && '⚡ They can access your portfolio immediately. Access will be auto-granted.'}
              {nominee.access_type === 'temporary' && '⏰ They get 7-day limited access. Perfect for temporary sharing.'}
              {nominee.access_type === 'after_dms' && '🛡️ Access only activates if you\'re inactive beyond your Dead Man\'s Switch threshold. Current access will be auto-revoked.'}
            </p>
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
