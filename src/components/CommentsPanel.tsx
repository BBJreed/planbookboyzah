import React, { useState } from 'react';
import { useStore } from '../stores/appStore';

interface Comment {
  id: string;
  entityId: string; // ID of the event/task being commented on
  entityType: 'event' | 'task';
  author: string;
  content: string;
  timestamp: Date;
  mentions: string[]; // User IDs mentioned in the comment
}

interface CommentsPanelProps {
  entityId: string;
  entityType: 'event' | 'task';
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ 
  entityId, 
  entityType,
  onClose 
}) => {
  const { events, tasks } = useStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  
  // Mock user data for demonstration
  const users = [
    { id: 'user1', name: 'Alice Johnson' },
    { id: 'user2', name: 'Bob Smith' },
    { id: 'user3', name: 'Charlie Brown' }
  ];
  
  const entity = entityType === 'event' 
    ? events.find(e => e.id === entityId)
    : tasks.find(t => t.id === entityId);
  
  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      entityId,
      entityType,
      author: 'Current User', // In real app, this would be the current user
      content: newComment,
      timestamp: new Date(),
      mentions
    };
    
    setComments([...comments, comment]);
    setNewComment('');
    setMentions([]);
  };
  
  const handleMention = (username: string) => {
    const userId = users.find(u => u.name === username)?.id || '';
    if (userId && !mentions.includes(userId)) {
      setMentions([...mentions, userId]);
      setNewComment(newComment + `@${username} `);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 20,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 1000,
      width: 400,
      maxHeight: 500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 15 
      }}>
        <h3 style={{ margin: 0 }}>
          Comments on {entityType}: {entity ? (entityType === 'event' ? (entity as any).title : (entity as any).content) : 'Unknown'}
        </h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: 0
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: 15,
        maxHeight: 300
      }}>
        {comments.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => (
            <div 
              key={comment.id} 
              style={{ 
                padding: '10px 0', 
                borderBottom: '1px solid #e5e7eb' 
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: 5 
              }}>
                <strong style={{ color: '#374151' }}>{comment.author}</strong>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {comment.timestamp.toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 0, color: '#1f2937' }}>{comment.content}</p>
              {comment.mentions.length > 0 && (
                <div style={{ 
                  marginTop: 5, 
                  fontSize: 12, 
                  color: '#3b82f6' 
                }}>
                  Mentions: {comment.mentions.map(id => 
                    users.find(u => u.id === id)?.name || id
                  ).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 10
      }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Type @ to mention someone"
          style={{
            width: '100%',
            minHeight: 80,
            padding: 10,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            resize: 'vertical'
          }}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <span style={{ fontSize: 12, color: '#6b7280', marginRight: 10 }}>
              Mention:
            </span>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleMention(user.name)}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                  marginRight: 5
                }}
              >
                @{user.name}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleAddComment}
            disabled={newComment.trim() === ''}
            style={{
              padding: '8px 16px',
              backgroundColor: newComment.trim() === '' ? '#e5e7eb' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: newComment.trim() === '' ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
};