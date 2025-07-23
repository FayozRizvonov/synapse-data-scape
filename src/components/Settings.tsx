import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database, 
  Users, 
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen bg-gradient-main">
      <ParticleBackground />
      <div className="relative z-10 p-8 space-y-10 max-w-5xl mx-auto">
        <div className="text-center pt-16 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-blue/20 dark:bg-gradient-cyan/20 border border-blue-500/30 dark:border-cyan-500/30">
              <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-cyan-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-glow">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Manage CLAIRE AI settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Appearance Settings */}
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:!bg-none dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600 dark:text-cyan-500" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Theme</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Switch between light and dark modes</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="border-blue-500/30 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-500 hover:bg-blue-50 dark:hover:bg-cyan-900/20"
                >
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Animations</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Enable smooth transitions and effects</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Particle Effects</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Show background particle animations</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:!bg-none dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600 dark:text-cyan-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Email Alerts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Receive important updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Push Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Real-time browser notifications</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Sound Alerts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Play sounds for important events</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:!bg-none dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-cyan-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Two-Factor Auth</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Session Timeout</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Auto-logout after inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Data Encryption</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Encrypt sensitive data</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-gradient-card backdrop-blur-xl border border-gray-200/50 dark:!bg-none dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-cyan-500" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Auto Backup</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Automatically backup your data</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Data Retention</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Keep data for 30 days</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  30 days
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700 dark:text-white">Export Data</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Download your data</p>
                </div>
                <Button variant="outline" size="sm" className="border-blue-500/30 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-500">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-8">
          <Button className="bg-gradient-blue dark:bg-gradient-cyan text-white border-0">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 