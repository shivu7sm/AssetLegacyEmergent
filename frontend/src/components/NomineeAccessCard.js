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

        {/* Access Type Selection + Grant Access - All in Single Row */}
        <div className="mb-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{color: '#E8C27C'}}>
            <Shield className="w-4 h-4" />
            Access Permissions & Control
          </p>
          <div className="grid grid-cols-4 gap-3">
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

            {/* Grant Access Card */}
            <div
              className="p-4 rounded-lg text-center transition-all flex flex-col justify-center"
              style={{
                background: nominee.access_granted 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: `2px solid ${nominee.access_granted ? '#10b981' : 'rgba(16, 185, 129, 0.4)'}`,
                boxShadow: nominee.access_granted ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {!nominee.access_granted ? (
                <>
                  <Shield className="w-7 h-7 mx-auto mb-2" style={{color: '#10b981'}} />
                  <p className="text-sm font-bold mb-1" style={{color: '#f8fafc'}}>
                    Grant Access
                  </p>
                  <Button 
                    onClick={generateAccess}
                    disabled={generating}
                    size="sm"
                    className="mt-2 w-full"
                    style={{background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '0.5rem'}}
                  >
                    {generating ? '...' : 'Generate Link'}
                  </Button>
                </>
              ) : (
                <>
                  <Check className="w-7 h-7 mx-auto mb-2" style={{color: '#10b981'}} />
                  <p className="text-sm font-bold mb-1" style={{color: '#10b981'}}>
                    Active
                  </p>
                  <div className="flex flex-col gap-1 mt-2">
                    <Button 
                      onClick={() => {
                        setShowLink(!showLink);
                        if (!accessLink) generateAccess();
                      }}
                      size="sm"
                      className="w-full"
                      style={{background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.75rem', padding: '0.4rem'}}
                    >
                      {showLink ? 'Hide' : 'Show'} Link
                    </Button>
                    <Button 
                      onClick={revokeAccess}
                      size="sm"
                      className="w-full"
                      style={{background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.75rem', padding: '0.4rem'}}
                    >
                      Revoke
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Link Display - Below the row */}
          {showLink && accessLink && (
            <div className="mt-3 p-3 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold mb-1" style={{color: '#10b981'}}>SECURE ACCESS LINK</p>
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
          
          {/* Explanation Text - Below the row */}
          <div className="mt-3 p-3 rounded-lg" style={{background: 'rgba(232, 194, 124, 0.05)', border: '1px solid rgba(232, 194, 124, 0.2)'}}>
            <p className="text-xs" style={{color: '#cbd5e1'}}>
              {nominee.access_type === 'immediate' && '⚡ Immediate access - They can view your portfolio right now. Access auto-granted.'}
              {nominee.access_type === 'temporary' && '⏰ Temporary access - 7-day limited access. Perfect for temporary sharing.'}
              {nominee.access_type === 'after_dms' && '🛡️ After DMS - Access only activates if you\'re inactive beyond your Dead Man\'s Switch threshold. Auto-revokes current access.'}
            </p>
          </div>
        </div>

        {/* Last Accessed Info */}
        {nominee.last_accessed_at && (
          <div className="text-xs text-center" style={{color: '#64748b'}}>
            Last accessed: {new Date(nominee.last_accessed_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
