import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';
import { PartnerCard } from '../components/partners/PartnerCard';
import { AddPartnerModal } from '../components/partners/AddPartnerModal';
import { getPartners, respondToInvite, cancelInvite, getPartnerStats } from '../services/partners';
import { useNotificationStore } from '../store/notificationStore';

interface Partner {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  partner?: {
    id: string;
    name: string;
    username: string;
  };
  user?: {
    id: string;
    name: string;
    username: string;
  };
}

interface PartnerStats {
  weeklyWorkouts: number;
  completionRate: number;
  totalWeight: number;
}

export function FitFam() {
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [acceptedPartners, setAcceptedPartners] = useState<Partner[]>([]);
  const [partnerStats, setPartnerStats] = useState<Record<string, PartnerStats>>({});
  const [pendingPartners, setPendingPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadPendingInvites } = useNotificationStore();

  const loadPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { sent, received } = await getPartners();
      
      // Filter accepted partners
      const accepted = [
        ...sent.filter(p => p.status === 'accepted'),
        ...received.filter(p => p.status === 'accepted').map(p => ({
          ...p,
          partner: p.user // Swap user to partner for consistent display
        }))
      ];
      setAcceptedPartners(accepted);
      
      // Filter pending partners
      const pending = [
        ...sent.filter(p => p.status === 'pending').map(p => ({ ...p, direction: 'sent' as const })),
        ...received.filter(p => p.status === 'pending').map(p => ({
          ...p,
          direction: 'received' as const,
          partner: p.user // Swap user to partner for consistent display
        }))
      ];
      setPendingPartners(pending);
      
      // Load stats for accepted partners
      const stats: Record<string, PartnerStats> = {};
      for (const partner of accepted) {
        try {
          const partnerStats = await getPartnerStats(partner.partner.id);
          stats[partner.partner.id] = {
            weeklyWorkouts: partnerStats.weeklyWorkouts,
            completionRate: partnerStats.completionRate,
            totalWeight: partnerStats.totalWeight
          };
        } catch (err) {
          console.error(`Failed to load stats for partner ${partner.partner.id}:`, err);
        }
      }
      setPartnerStats(stats);
      
    } catch (err) {
      console.error('Failed to load partners:', err);
      setAcceptedPartners([]);
      setPendingPartners([]);
      setError('Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await respondToInvite(inviteId, 'accepted');
      await loadPendingInvites();
      await loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await respondToInvite(inviteId, 'rejected');
      await loadPendingInvites();
      await loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invite');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      await loadPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite');
    }
  };

  const filteredPartners = {
    sent: pendingPartners.filter(p => 
      p.partner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partner?.username.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    received: pendingPartners.filter(p =>
      p.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user?.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your FitFam</h1>
            <p className="text-gray-400">Connect and train with others to stay motivated</p>
          </div>
          <button
            onClick={() => setShowAddPartner(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-400 rounded-lg hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add to FitFam</span>
          </button>
        </div>

        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search FitFam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-500/50 text-white pl-12"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-8">
            Loading your FitFam...
          </div>
        ) : (
          <div className="space-y-8">
          {pendingPartners.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">FitFam Invites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPartners.map((invite) => (
                  <PartnerCard
                    key={invite.id}
                    id={invite.id}
                    name={invite.partner.name}
                    username={invite.partner.username}
                    workoutCount={0}
                    joinedDate={new Date(invite.created_at).toLocaleDateString()}
                    status={invite.status}
                    direction={invite.direction}
                    onAccept={() => handleAcceptInvite(invite.id)}
                    onDecline={() => handleDeclineInvite(invite.id)}
                    onCancel={() => handleCancelInvite(invite.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {acceptedPartners.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Your FitFam</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedPartners.map((partner) => (
                  <PartnerCard
                    key={partner.id}
                    id={partner.id}
                    name={partner.partner.name}
                    username={partner.partner.username}
                    workoutCount={0}
                    joinedDate={new Date(partner.created_at).toLocaleDateString()}
                    status={partner.status}
                    direction="accepted"
                  />
                ))}
              </div>
            </div>
          )}

          {acceptedPartners.length === 0 && pendingPartners.length === 0 && (
            <div className="text-center py-8">
              {error ? (
                <p className="text-red-400 mb-2">{error}</p>
              ) : (
                <p className="text-gray-400">No FitFam members found. Start by adding someone to your FitFam!</p>
              )}
            </div>
          )}
          </div>
        )}

        {showAddPartner && (
          <AddPartnerModal
            onClose={() => {
              setShowAddPartner(false);
              loadPartners();
            }}
          />
        )}
      </div>
    </div>
  );
}