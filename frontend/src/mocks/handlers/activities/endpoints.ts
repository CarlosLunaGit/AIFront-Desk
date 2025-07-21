// Activity History System Handlers
import { http, HttpResponse } from 'msw';
import { mockActivityHistory, ActivityHistoryEntry } from '../../data/activityHistory';

// Use dynamic activity history that gets updated with new actions
let activityHistory: ActivityHistoryEntry[] = [...mockActivityHistory];

export const activityHistoryHandlers = [
  // Get all activity history
  http.get('/api/activity-history', ({ request }) => {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    const category = url.searchParams.get('category');
    const severity = url.searchParams.get('severity');
    const timeRange = url.searchParams.get('timeRange');
    
    let filteredHistory = activityHistory;
    
    // Filter by hotel if specified
    if (hotelId) {
      filteredHistory = filteredHistory.filter(entry => entry.hotelId === hotelId);
    }
    
    // Filter by category if specified
    if (category && category !== 'all') {
      filteredHistory = filteredHistory.filter(entry => entry.category === category);
    }
    
    // Filter by severity if specified
    if (severity && severity !== 'all') {
      filteredHistory = filteredHistory.filter(entry => entry.severity === severity);
    }
    
    // Filter by time range if specified
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      filteredHistory = filteredHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const diffHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
        
        switch (timeRange) {
          case '24h':
            return diffHours <= 24;
          case '7d':
            return diffHours <= 7 * 24;
          case '30d':
            return diffHours <= 30 * 24;
          default:
            return true;
        }
      });
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return HttpResponse.json(filteredHistory);
  }),

  // Add new activity entry
  http.post('/api/activity-history', async ({ request }) => {
    const activityData = await request.json() as Partial<ActivityHistoryEntry>;
    
    const newActivity: ActivityHistoryEntry = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      hotelId: activityData.hotelId || '',
      category: activityData.category || 'system',
      action: activityData.action || 'unknown_action',
      description: activityData.description || 'Activity performed',
      entityType: activityData.entityType || 'system',
      entityId: activityData.entityId,
      entityName: activityData.entityName,
      performedBy: activityData.performedBy || 'system',
      details: activityData.details || {},
      severity: activityData.severity || 'info',
      affectedEntities: activityData.affectedEntities || []
    };
    
    activityHistory.push(newActivity);
    
    return HttpResponse.json(newActivity, { status: 201 });
  }),

  // Get activity statistics
  http.get('/api/activity-history/stats', ({ request }) => {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotelId');
    
    let filteredHistory = activityHistory;
    if (hotelId) {
      filteredHistory = filteredHistory.filter(entry => entry.hotelId === hotelId);
    }
    
    // Calculate statistics
    const stats = {
      total: filteredHistory.length,
      byCategory: filteredHistory.reduce((acc, activity) => {
        acc[activity.category] = (acc[activity.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: filteredHistory.reduce((acc, activity) => {
        acc[activity.severity] = (acc[activity.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTimeRange: {
        last24h: filteredHistory.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          const now = new Date();
          return (now.getTime() - activityDate.getTime()) <= 24 * 60 * 60 * 1000;
        }).length,
        last7d: filteredHistory.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          const now = new Date();
          return (now.getTime() - activityDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        }).length,
        last30d: filteredHistory.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          const now = new Date();
          return (now.getTime() - activityDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        }).length
      }
    };
    
    return HttpResponse.json(stats);
  })
];

// Helper function to add activity entries from other parts of the system
export const addActivityEntry = (activity: Partial<ActivityHistoryEntry>) => {
  const newActivity: ActivityHistoryEntry = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    hotelId: activity.hotelId || '',
    category: activity.category || 'system',
    action: activity.action || 'unknown_action',
    description: activity.description || 'Activity performed',
    entityType: activity.entityType || 'system',
    entityId: activity.entityId,
    entityName: activity.entityName,
    performedBy: activity.performedBy || 'system',
    details: activity.details || {},
    severity: activity.severity || 'info',
    affectedEntities: activity.affectedEntities || []
  };
  
  activityHistory.push(newActivity);
  return newActivity;
}; 