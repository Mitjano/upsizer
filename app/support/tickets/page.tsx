"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface TicketReply {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
}

interface ReplyFormState {
  ticketId: string | null;
  message: string;
  sending: boolean;
}

export default function MyTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyForm, setReplyForm] = useState<ReplyFormState>({
    ticketId: null,
    message: '',
    sending: false,
  });

  const fetchMyTickets = useCallback(async () => {
    try {
      const response = await fetch('/api/user/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchMyTickets();
    }
  }, [status, router, fetchMyTickets]);

  const handleReplySubmit = async (ticketId: string) => {
    if (!replyForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (replyForm.message.length < 5) {
      toast.error('Message must be at least 5 characters');
      return;
    }

    setReplyForm(prev => ({ ...prev, sending: true }));

    try {
      const response = await fetch('/api/user/tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          message: replyForm.message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reply');
      }

      toast.success('Reply sent successfully!');
      setReplyForm({ ticketId: null, message: '', sending: false });
      fetchMyTickets(); // Refresh tickets
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reply';
      toast.error(errorMessage);
      setReplyForm(prev => ({ ...prev, sending: false }));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-500/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'closed': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              My Support Tickets
            </h1>
            <p className="text-gray-400">View and track all your support requests</p>
          </div>
          <Link
            href="/support"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Create New Ticket
          </Link>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold mb-2">No tickets yet</h2>
            <p className="text-gray-400 mb-6">You haven't created any support tickets</p>
            <Link
              href="/support"
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority === 'urgent' && '🔴'}
                        {ticket.priority === 'high' && '🟠'}
                        {ticket.priority === 'medium' && '🟡'}
                        {ticket.priority === 'low' && '🟢'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 {new Date(ticket.createdAt).toLocaleString()}</span>
                      <span>🔄 Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span>💬 {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {ticket.replies && ticket.replies.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-sm text-gray-400 mb-3">Conversation:</h4>
                    {ticket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-lg ${
                          reply.isAdmin
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-gray-700/50 border border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {reply.isAdmin ? '🛡️ Support Team' : '👤 You'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(reply.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form for Open Tickets */}
                {(ticket.status === 'open' || ticket.status === 'in-progress') && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    {replyForm.ticketId === ticket.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={replyForm.message}
                          onChange={(e) => setReplyForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Write your reply..."
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          rows={3}
                          disabled={replyForm.sending}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReplySubmit(ticket.id)}
                            disabled={replyForm.sending || !replyForm.message.trim()}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"
                          >
                            {replyForm.sending ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Sending...
                              </span>
                            ) : 'Send Reply'}
                          </button>
                          <button
                            onClick={() => setReplyForm({ ticketId: null, message: '', sending: false })}
                            disabled={replyForm.sending}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyForm(prev => ({ ...prev, ticketId: ticket.id }))}
                        className="text-sm text-green-400 hover:text-green-300 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add a reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
