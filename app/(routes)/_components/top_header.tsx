import { notification as notificationIcon, search } from '@/assets'
import Image from 'next/image'
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { useAuth } from '@/context/auth_context'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Bell, Ban, CheckCheck, Clock, X } from 'lucide-react'
import { useSearch } from '@/app/context/SearchContext'

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      _id
      name
      email
      role
    }
  }
`;

const GET_UNREAD_NOTIFICATIONS = gql`
  query GetUnreadNotifications {
    getUnreadNotifications {
      _id
      title
      message
      type
      isRead
      createdAt
      eventId
      userId
    }
  }
`;

const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($input: MarkNotificationAsReadInput!) {
    markNotificationAsRead(input: $input) {
      _id
      isRead
    }
  }
`

const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`

interface TopHeaderProps {
  placeholder: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  eventId?: string;
}

const TopHeader: React.FC<TopHeaderProps> = ({ placeholder }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useSearch();
  const [hasAuthToken, setHasAuthToken] = useState(false)

  // Check for auth token on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookieToken = document.cookie.includes("accessToken");
      const localToken = !!localStorage.getItem("token");
      const sessionToken = !!sessionStorage.getItem("token");
      const hasToken = cookieToken || localToken || sessionToken;
      
      setHasAuthToken(hasToken);
    }
  }, [])

  // Enhanced debug logging for skip conditions
  const skipNotificationQuery = false; // Always run the query
  
  // Query for current user
  const { data: currentUserData } = useQuery(GET_CURRENT_USER, {
    skip: !user,
    onCompleted: (data) => {
      console.log("Current user query completed:", {
        hasData: !!data,
        user: data?.getCurrentUser
      });
    },
    onError: (error) => {
      console.error("Current user query error:", error);
    }
  });

  const { data, loading, error, refetch } = useQuery(GET_UNREAD_NOTIFICATIONS, {
    skip: skipNotificationQuery,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      console.log("✅ Notifications loaded:", data?.getUnreadNotifications?.length || 0, "unread");
    },
    onError: (error) => {
      console.error("❌ Notification query error:", error.message);
    }
  })

  const unreadNotifications = data?.getUnreadNotifications || []

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    onCompleted: (data) => {
      console.log("Mark as read completed:", data);
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
    }
  });

  const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
    onCompleted: (data) => {
      console.log("Mark all as read completed:", data);
    },
    onError: (error) => {
      console.error("Mark all as read error:", error);
    }
  });

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    // Prevent event propagation to avoid closing the notification panel
    e.stopPropagation();
    
    try {
      await markAllAsRead();
      refetch();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // Force refetch when notifications are shown
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications) {
      console.log("Refetching notifications...");
      // Add retry logic for failed queries
      if (error) {
        console.log("Previous query had error, attempting refetch...");
      }
      refetch().catch(err => {
        console.error("Manual refetch failed:", err);
      });
    }
  }

  const handleNotificationItemClick = async (notif: Notification) => {
    try {
      await markAsRead({
        variables: {
          input: {
            notificationId: notif._id,
          },
        },
      })

      // Refetch notifications to update the UI
      refetch()

      // Route based on notification type
      if (notif.type === "MUSHER_SUBMISSION") {
        router.push('/manage-musher/pending-forms')
      } else if (notif.type.toLowerCase().includes('submission') || 
          notif.type === "EVENT_SUBMISSION") {
        router.push('/calendar?tab=2')
      } else if (notif.type.includes("EVENT") && notif.eventId) {
        router.push(`/events/${notif.eventId}`)
      }

      setShowNotifications(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    console.log('Rendering icon for notification type:', type);
    
    // Handle case insensitivity and partial matches
    const typeLC = type.toLowerCase();
    
    if (typeLC.includes('submission') || typeLC.includes('submit')) {
      return <Bell className="w-5 h-5 text-blue-500" />;
    }
    
    if (typeLC.includes('status') && typeLC.includes('update') || 
        typeLC.includes('approved') || 
        typeLC.includes('accept')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    if (typeLC.includes('declined') || 
        typeLC.includes('reject') || 
        typeLC.includes('denied')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    
    if (typeLC.includes('ban') || 
        typeLC.includes('block') || 
        typeLC.includes('restrict')) {
      return <Ban className="w-5 h-5 text-red-500" />;
    }
    
    // Exact matches as fallback
    switch (type) {
      case "EVENT_SUBMISSION":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "EVENT_STATUS_UPDATE":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "EVENT_DECLINED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "EVENT_REJECTION":
        return <Ban className="w-5 h-5 text-red-500" />;
      default:
        console.log('Using default icon - type did not match any case:', type);
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className='w-full flex justify-between items-center pt-[30px] pb-[24px] pl-[28px] pr-[47px]'>
        <div className='h-[48px] w-[592px] border rounded-[16px] px-4 flex gap-x-[8px] items-center'>
            <Image width={24} height={24} src={search} alt='search icon' />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={placeholder} className='text-[1rem] font-[600] w-full outline-none' type="text" name="" id="" />
        </div>
    
        <div className='relative'>
            <button onClick={handleNotificationClick} className='w-[48px] h-[48px] border rounded-[12px] relative flex justify-center items-center hover:bg-gray-200 transition-colors group'>
                <Image width={24} height={24} src={notificationIcon} alt='Notification icon' />
                {unreadNotifications.length > 0 && (
                    <div className='absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-red-500 flex items-center justify-center px-1'>
                        <span className='text-white text-xs font-semibold'>
                            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                        </span>
                    </div>
                )}
            </button>

            {showNotifications && (
                    <div className='absolute right-0 mt-3 w-[380px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200'>
                        {/* Header */}
                        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100'>
                            <div className='flex justify-between items-center'>
                                <div className='flex items-center gap-2'>
                                    <Bell className='w-5 h-5 text-blue-600' />
                                    <h3 className='text-lg font-semibold text-gray-900'>Notifications</h3>
                                    {unreadNotifications.length > 0 && (
                                        <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full'>
                                            {unreadNotifications.length} new
                                        </span>
                                    )}
                                </div>
                                <div className='flex items-center gap-2'>
                                    {unreadNotifications.length > 0 && (
                                        <button 
                                            onClick={e => handleMarkAllAsRead(e)}
                                            className='flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium bg-white px-2 py-1 rounded-md hover:bg-blue-50'
                                        >
                                            <CheckCheck className='w-3 h-3' />
                                            Mark all read
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowNotifications(false)}
                                        className='text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-md'
                                    >
                                        <X className='w-4 h-4' />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className='max-h-[480px] overflow-y-auto'>
                            {loading ? (
                                <div className='flex flex-col items-center justify-center py-12'>
                                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4'></div>
                                    <p className='text-gray-500 text-sm'>Loading notifications...</p>
                                </div>
                            ) : error ? (
                                <div className='text-center py-12 px-4'>
                                    <XCircle className='w-12 h-12 text-red-400 mx-auto mb-4' />
                                    <p className='text-red-600 text-sm font-medium mb-2'>Failed to load notifications</p>
                                    <p className='text-gray-400 text-xs mb-4'>{error.message}</p>
                                    <button 
                                        onClick={e => {
                                            e.stopPropagation();
                                            refetch().catch(err => console.error("Error refetch failed:", err));
                                        }}
                                        className='text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors'
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : unreadNotifications.length === 0 ? (
                                <div className='text-center py-12 px-4'>
                                    <Bell className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                                    <p className='text-gray-500 font-medium mb-1'>All caught up!</p>
                                    <p className='text-gray-400 text-sm'>No new notifications to show</p>
                                </div>
                            ) : (
                                <div className='divide-y divide-gray-100'>
                                    {unreadNotifications.map((notif: Notification, index: number) => (
                                        <div 
                                            key={notif._id} 
                                            onClick={() => handleNotificationItemClick(notif)} 
                                            className='p-4 hover:bg-gray-200 cursor-pointer transition-all duration-200 hover:shadow-sm group'
                                            style={{
                                                animationDelay: `${index * 50}ms`
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className='flex-shrink-0 mt-1'>
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className='flex items-start justify-between gap-2 mb-1'>
                                                        <h4 className='text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-900 transition-colors'>
                                                            {notif.title}
                                                        </h4>
                                                        <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1'></div>
                                                    </div>
                                                    <p className='text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2'>
                                                        {notif.message}
                                                    </p>
                                                    <div className='flex items-center gap-1 text-xs text-gray-400'>
                                                        <Clock className='w-3 h-3' />
                                                        <span>{new Date(notif.createdAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
            )}
        </div>
    </div>
  )
}

export default TopHeader