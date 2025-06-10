import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Phone as PhoneIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  type: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  timestamp: string;
  sender: {
    name: string;
    avatar?: string;
  };
}

const CommunicationInterface: React.FC = () => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for selected guest
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', selectedGuest],
    queryFn: async () => {
      if (!selectedGuest) return [];
      const response = await fetch(`/api/communications/${selectedGuest}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedGuest,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedGuest) throw new Error('No guest selected');
      const response = await fetch('/api/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuest,
          content,
          channel: 'whatsapp',
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedGuest] });
      setNewMessage('');
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessage.isPending) {
      sendMessage.mutate(newMessage.trim());
    }
  };

  const getMessageStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'read':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar src={selectedGuest ? '/guest-avatar.png' : undefined} />
            <Box ml={2}>
              <Typography variant="h6">
                {selectedGuest ? 'Guest Name' : 'Select a guest'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedGuest ? 'Online' : 'No guest selected'}
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton>
              <PhoneIcon />
            </IconButton>
            <IconButton>
              <VideocamIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {messages?.map((message) => (
              <React.Fragment key={message.id}>
                <ListItem
                  sx={{
                    flexDirection: message.type === 'outbound' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={message.sender.avatar} />
                  </ListItemAvatar>
                  <Box
                    sx={{
                      maxWidth: '70%',
                      bgcolor: message.type === 'outbound' ? '#e3f2fd' : 'white',
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    <ListItemText
                      primary={message.content}
                      secondary={
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mt={0.5}
                        >
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </Typography>
                          {message.type === 'outbound' && (
                            <Chip
                              label={message.status}
                              size="small"
                              color={getMessageStatusColor(message.status)}
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </Box>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton>
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={!selectedGuest || sendMessage.isPending}
          sx={{ mx: 2 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!newMessage.trim() || !selectedGuest || sendMessage.isPending}
        >
          {sendMessage.isPending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default CommunicationInterface; 