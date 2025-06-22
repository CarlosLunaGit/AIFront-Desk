import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Conversation, CommunicationStats } from '../../types/communication';
import { CommunicationInterface } from './CommunicationInterface';
import {
  getLanguageFlag,
  formatTime,
  truncateMessage,
  sortConversationsByPriority,
} from '../../utils/communicationUtils';

export const CommunicationsDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobileConversation, setShowMobileConversation] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [statsResponse, conversationsResponse] = await Promise.all([
          fetch('/api/communications/stats'),
          fetch('/api/communications/conversations')
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error('Failed to fetch stats:', statsResponse.status, statsResponse.statusText);
        }

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          setConversations(sortConversationsByPriority(conversationsData));
        } else {
          console.error('Failed to fetch conversations:', conversationsResponse.status, conversationsResponse.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTakeover = async (conversationId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/communications/conversations/${conversationId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, reason })
      });

      if (response.ok) {
        const { conversation } = await response.json();
        setConversations(prev => 
          prev.map(conv => conv.id === conversationId ? conversation : conv)
        );
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(conversation);
        }
      }
    } catch (error) {
      console.error('Failed to take over conversation:', error);
    }
  };

  const handleSendMessage = async (conversationId: string, content: string) => {
    try {
      const response = await fetch(`/api/communications/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content,
          channel: selectedConversation?.channel || 'whatsapp'
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: content,
                lastMessageTime: newMessage.timestamp
              };
            }
            return conv;
          })
        );

        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: content,
            lastMessageTime: newMessage.timestamp
          } : null);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileConversation(true);
    
    // Load full conversation data with messages
    fetch(`/api/communications/conversations/${conversation.id}`)
      .then(response => response.json())
      .then(fullConversation => {
        setSelectedConversation(fullConversation);
      })
      .catch(error => {
        console.error('Failed to load full conversation:', error);
      });
  };

  const closeConversation = () => {
    setShowMobileConversation(false);
    setSelectedConversation(null);
  };

  const getChannelMUIIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <WhatsAppIcon color="success" />;
      case 'sms': return <SmsIcon color="primary" />;
      case 'email': return <EmailIcon color="warning" />;
      case 'call': return <PhoneIcon color="secondary" />;
      default: return <PersonIcon />;
    }
  };

  const getStatusChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'ai': return 'primary';
      case 'human': return 'error';
      case 'waiting': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getPriorityChipColor = (priority: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Box textAlign="center">
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading communications...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Communications Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage guest conversations across all channels
            </Typography>
          </Box>
          {stats && (
            <Box display="flex" gap={3}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {stats.totalActive}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5" color="warning.main" fontWeight="bold">
                  {stats.totalWaiting}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Waiting
                </Typography>
              </Box>
              {stats.alertsCount > 0 && (
                <Box textAlign="center">
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    {stats.alertsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Alerts
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Channel Overview Cards */}
      {stats && stats.channels && (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            {stats.channels.map((channel) => (
              <Grid item xs={6} md={3} key={channel.channel}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      {getChannelMUIIcon(channel.channel)}
                      <ScheduleIcon 
                        sx={{ 
                          fontSize: 12, 
                          color: channel.active > 0 ? 'success.main' : 'grey.400' 
                        }} 
                      />
                    </Box>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                      {channel.channel}
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Active: {channel.active}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Waiting: {channel.waiting}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversation List */}
        <Paper 
          elevation={1} 
          sx={{ 
            width: isMobile ? '100%' : 320,
            display: showMobileConversation && isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            mr: isMobile ? 0 : 2
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Conversations</Typography>
            <Typography variant="body2" color="text.secondary">
              {conversations.length} total
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">No conversations yet</Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {conversations.map((conversation, index) => (
                  <React.Fragment key={conversation.id}>
                    <ListItem
                      button
                      onClick={() => selectConversation(conversation)}
                      selected={selectedConversation?.id === conversation.id}
                      sx={{ 
                        py: 2,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {getChannelMUIIcon(conversation.channel)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <React.Fragment>
                            <Typography variant="subtitle2" noWrap component="span" display="block">
                              {conversation.guestName}
                            </Typography>
                            <Typography variant="caption" component="span" sx={{ float: 'right' }}>
                              {conversation.language ? getLanguageFlag(conversation.language.code) : '🌐'} {formatTime(conversation.lastMessageTime)}
                            </Typography>
                          </React.Fragment>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                          <React.Fragment>
                            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                              <Chip 
                                size="small" 
                                label={(conversation.priority || 'low').toUpperCase()}
                                color={getPriorityChipColor(conversation.priority || 'low')}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.6rem' }}
                              />
                              <Chip 
                                size="small" 
                                label={(conversation.status || 'ai').toUpperCase()}
                                color={getStatusChipColor(conversation.status || 'ai')}
                                variant="filled"
                                sx={{ height: 20, fontSize: '0.6rem' }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {truncateMessage(conversation.lastMessage || 'No message', 40)}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < conversations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* Communication Interface */}
        <Box 
          sx={{ 
            flexGrow: 1,
            display: showMobileConversation || !isMobile ? 'flex' : 'none'
          }}
        >
          {selectedConversation ? (
            <CommunicationInterface
              conversation={selectedConversation}
              onTakeover={handleTakeover}
              onSendMessage={handleSendMessage}
              onClose={closeConversation}
            />
          ) : (
            <Paper 
              elevation={1} 
              sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                Select a conversation
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Choose a conversation from the list to view messages and interact with guests
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}; 