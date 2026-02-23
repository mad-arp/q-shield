import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Vibrate, Smartphone, Bell, BellOff, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateSetting, AppSettings } from '@/lib/settings';
import { requestNotificationPermission, canSendNotifications } from '@/lib/notifications';
import { useFeedback } from '@/hooks/useFeedback';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [notifStatus, setNotifStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const { feedback } = useFeedback();

  const handleToggle = (key: keyof AppSettings) => async (checked: boolean) => {
    if (key === 'notificationsEnabled' && checked) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotifStatus(Notification.permission);
        return;
      }
      setNotifStatus('granted');
    }
    
    const updated = updateSetting(key, checked);
    setSettings(updated);
    feedback('click');
  };

  const settingsGroups = [
    {
      title: 'AUDIO & HAPTICS',
      items: [
        {
          key: 'soundEnabled' as keyof AppSettings,
          label: 'Sound Effects',
          description: 'Play sound on scan, threat detection, and safe verification',
          icon: settings.soundEnabled ? Volume2 : VolumeX,
        },
        {
          key: 'hapticsEnabled' as keyof AppSettings,
          label: 'Haptic Feedback',
          description: 'Vibration feedback on scan events and alerts',
          icon: Vibrate,
        },
      ],
    },
    {
      title: 'DISPLAY',
      items: [
        {
          key: 'splashEnabled' as keyof AppSettings,
          label: 'Splash Screen',
          description: 'Show animated splash screen on app launch',
          icon: Monitor,
        },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      items: [
        {
          key: 'notificationsEnabled' as keyof AppSettings,
          label: 'Push Notifications',
          description: notifStatus === 'denied'
            ? 'Notifications blocked. Enable in browser/device settings.'
            : notifStatus === 'unsupported'
            ? 'Not supported on this device'
            : 'Receive alerts when threats are detected',
          icon: settings.notificationsEnabled ? Bell : BellOff,
          disabled: notifStatus === 'denied' || notifStatus === 'unsupported',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background matrix-bg scanline">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container flex items-center h-16 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-wider text-primary text-glow">
              SETTINGS
            </span>
          </div>
        </div>
      </motion.header>

      {/* Settings Content */}
      <main className="container px-4 py-6 space-y-8">
        {settingsGroups.map((group, gi) => (
          <motion.section
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
          >
            <h2 className="font-display text-xs text-primary/70 tracking-widest mb-4">
              {group.title}
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[item.key]}
                      onCheckedChange={handleToggle(item.key)}
                      disabled={'disabled' in item && item.disabled}
                      className="shrink-0 ml-3"
                    />
                  </div>
                );
              })}
            </div>
          </motion.section>
        ))}

        {/* App Info */}
        <motion.section
          className="pt-4 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center space-y-1">
            <p className="text-xs font-mono text-muted-foreground">Q-SHIELD v1.0.0</p>
            <p className="text-xs font-mono text-muted-foreground/50">QUISHING DETECTION SYSTEM</p>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Settings;
