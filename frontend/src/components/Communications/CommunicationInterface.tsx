import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  LinearProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Phone as PhoneIcon,
  ArrowBack as BackIcon,
  PersonAdd as TakeoverIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  Circle as StatusIcon,
} from '@mui/icons-material';
import { 
  Conversation
} from '../../types/communication';
import { 
  getLanguageFlag, 
  formatTime
} from '../../utils/communicationUtils';

interface CommunicationInterfaceProps {
  conversation: Conversation | null;
  onTakeover: (conversationId: string, reason?: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
  onClose: () => void;
}

export const CommunicationInterface: React.FC<CommunicationInterfaceProps> = ({
  conversation,
  onTakeover,
  onSendMessage,
  onClose
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [takeoverReason, setTakeoverReason] = useState('');
  const [showTakeoverDialog, setShowTakeoverDialog] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleConfirmTakeover = useCallback(() => {
    if (conversation) {
      onTakeover(conversation.id, takeoverReason);
      setShowTakeoverDialog(false);
      setTakeoverReason('');
      setCountdown(null);
    }
  }, [conversation, onTakeover, takeoverReason]);

  // Handle call takeover countdown
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleConfirmTakeover();
    }
  }, [countdown, handleConfirmTakeover]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleTakeoverClick = () => {
    if (conversation?.channel === 'call') {
      setCountdown(15);
      setShowTakeoverDialog(true);
    } else {
      setShowTakeoverDialog(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && conversation) {
      onSendMessage(conversation.id, messageInput.trim());
      setMessageInput('');
    }
  };

  const getChannelMUIIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <WhatsAppIcon color="success" />;
      case 'sms': return <SmsIcon color="primary" />;
      case 'email': return <EmailIcon color="warning" />;
      case 'call': return <PhoneIcon color="secondary" />;
      default: return <MessageIcon />;
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

  const canTakeover = conversation?.status === 'ai' || conversation?.status === 'waiting';
  const isStaffControlled = conversation?.status === 'human';

  if (!conversation) {
    return (
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
        <MessageIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="h6" color="text.secondary">
          Select a conversation
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Choose a conversation from the list to view messages and interact with guests
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" flexGrow={1}>
            {isMobile && (
              <IconButton edge="start" onClick={onClose} sx={{ mr: 2 }}>
                <BackIcon />
              </IconButton>
            )}
            
            <Box display="flex" alignItems="center" gap={2}>
              <StatusIcon 
                sx={{ 
                  fontSize: 12, 
                  color: conversation.status === 'ai' ? 'primary.main' : 
                         conversation.status === 'human' ? 'error.main' : 
                         conversation.status === 'waiting' ? 'warning.main' : 'success.main'
                }} 
              />
              {getChannelMUIIcon(conversation.channel)}
              <Box>
                <Typography variant="h6" component="h2">
                  {conversation.guestName}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    {conversation.guestPhone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">•</Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2">
                      {conversation.language ? getLanguageFlag(conversation.language.code) : '🌐'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {conversation.language ? conversation.language.name : 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              size="small" 
              label={(conversation.priority || 'low').toUpperCase()}
              color={getPriorityChipColor(conversation.priority || 'low')}
              variant="outlined"
            />
            <Chip 
              size="small" 
              label={(conversation.status || 'ai').toUpperCase()}
              color={getStatusChipColor(conversation.status || 'ai')}
              variant="filled"
            />
            {canTakeover && (
              <Button
                variant="contained"
                startIcon={<TakeoverIcon />}
                onClick={handleTakeoverClick}
                size="small"
              >
                Take Over
              </Button>
            )}
          </Box>
        </Toolbar>

        {/* Call-specific info */}
        {conversation.channel === 'call' && conversation.callData && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'primary.50' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StatusIcon 
                    sx={{ 
                      fontSize: 8, 
                      color: conversation.callData.isActive ? 'success.main' : 'grey.400' 
                    }} 
                  />
                  <Typography variant="body2" fontWeight="medium">
                    {conversation.callData.isActive ? 'Active Call' : 'Call Ended'}
                  </Typography>
                </Box>
                {conversation.callData.duration && (
                  <Typography variant="body2" color="text.secondary">
                    Duration: {Math.floor(conversation.callData.duration / 60)}:{(conversation.callData.duration % 60).toString().padStart(2, '0')}
                  </Typography>
                )}
              </Box>
              {conversation.callData.isActive && countdown !== null && (
                <Typography variant="body2" color="primary.main" fontWeight="medium">
                  Takeover in: {countdown}s
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </AppBar>

      {/* Messages or Call Transcript */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {conversation.channel === 'call' && conversation.callData?.transcriptSegments ? (
          // Call transcript view
          <Box>
            <Typography variant="h6" gutterBottom>
              Live Transcript
            </Typography>
            <List>
              {(conversation.callData?.transcriptSegments || []).map((segment, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: segment.speaker === 'guest' ? 'grey.100' :
                                segment.speaker === 'ai' ? 'primary.100' : 'success.100',
                        color: segment.speaker === 'guest' ? 'grey.600' :
                               segment.speaker === 'ai' ? 'primary.600' : 'success.600',
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem'
                      }}
                    >
                      {segment.speaker === 'guest' ? 'G' : segment.speaker === 'ai' ? 'AI' : 'S'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                          {segment.speaker}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(segment.timestamp)}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          ({Math.round(segment.confidence * 100)}%)
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body1" color="text.primary">
                        {segment.text}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          // Regular message view
          <List>
            {(conversation.messages || []).map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.type === 'outbound' ? 'flex-end' : 'flex-start',
                  px: 0,
                  py: 1
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    maxWidth: '70%',
                    px: 2,
                    py: 1,
                    bgcolor: message.type === 'outbound'
                      ? message.sender === 'ai'
                        ? 'primary.main'
                        : 'success.main'
                      : 'grey.100',
                    color: message.type === 'outbound' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.8,
                        textTransform: 'capitalize'
                      }}
                    >
                      {message.sender === 'ai' ? 'AI' : message.sender === 'staff' ? 'Staff' : 'Guest'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {formatTime(message.timestamp)}
                      </Typography>
                      {message.confidence && (
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          ({Math.round(message.confidence * 100)}%)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </ListItem>
            ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      {conversation.channel !== 'call' && isStaffControlled && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Box component="form" onSubmit={handleSendMessage} display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              variant="outlined"
            />
            <IconButton
              type="submit"
              disabled={!messageInput.trim()}
              color="primary"
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Takeover Dialog */}
      <Dialog open={showTakeoverDialog} onClose={() => setShowTakeoverDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {conversation.channel === 'call' ? 'Take Over Call' : 'Take Over Conversation'}
        </DialogTitle>
        <DialogContent>
          {countdown !== null ? (
            <Box textAlign="center" py={2}>
              <Typography variant="h2" color="primary.main" fontWeight="bold" gutterBottom>
                {countdown}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Preparing to take over the call. The guest will be notified.
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={((15 - countdown) / 15) * 100} 
                sx={{ mt: 2 }}
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                You are about to take over this conversation from the AI. The guest will be notified of the transfer.
              </Typography>
              
              <TextField
                fullWidth
                label="Reason (optional)"
                value={takeoverReason}
                onChange={(e) => setTakeoverReason(e.target.value)}
                placeholder="e.g., Complex inquiry requiring human assistance"
                variant="outlined"
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {countdown !== null ? (
            <Button
              onClick={() => {
                setCountdown(null);
                setShowTakeoverDialog(false);
              }}
            >
              Cancel
            </Button>
          ) : (
            <>
              <Button onClick={() => setShowTakeoverDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmTakeover} variant="contained">
                Take Over
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 