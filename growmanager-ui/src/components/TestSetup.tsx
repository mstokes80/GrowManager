import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNotification } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { CheckCircle2, Info } from 'lucide-react';

export function TestSetup() {
  const { toast } = useToast();
  const notification = useNotification();
  const { isAuthenticated, user } = useAuthStore();

  const testNotifications = () => {
    notification.success('Success!', 'All components are working correctly.');
    notification.info('Info', 'React Query DevTools should be visible in dev mode.');
    notification.warning('Warning', 'This is a test warning message.');
    toast({
      title: 'Toast Test',
      description: 'shadcn/ui toast is working!',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-grow-dark mb-6">GrowManager Setup Test</h1>

      <div className="space-y-6">
        {/* Status Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Verify all components are working correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                <span>Tailwind CSS configured with custom colors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                <span>shadcn/ui components installed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                <span>React Query configured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                <span>Zustand stores created</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                <span>Axios interceptors configured</span>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle2 className="h-5 w-5 text-status-healthy" />
                ) : (
                  <Info className="h-5 w-5 text-blue-500" />
                )}
                <span>
                  Auth Status: {isAuthenticated ? `Logged in as ${user?.email}` : 'Not authenticated'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Tests */}
        <Tabs defaultValue="components" className="w-full">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>

          <TabsContent value="components">
            <Card>
              <CardHeader>
                <CardTitle>Component Test</CardTitle>
                <CardDescription>Test shadcn/ui components and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                </div>
                <Button onClick={testNotifications} className="w-full">
                  Test Notifications & Toast
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms">
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Test form components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-input">Test Input</Label>
                  <Input
                    id="test-input"
                    placeholder="Type something..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Custom Colors</CardTitle>
                <CardDescription>GrowManager theme colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Grow Colors</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-grow-light rounded"></div>
                        <span className="text-sm">Light</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-grow rounded"></div>
                        <span className="text-sm">Default</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-grow-dark rounded"></div>
                        <span className="text-sm">Dark</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Plant Stages</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-plant-seedling rounded"></div>
                        <span className="text-sm">Seedling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-plant-vegetative rounded"></div>
                        <span className="text-sm">Vegetative</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-plant-flowering rounded"></div>
                        <span className="text-sm">Flowering</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-plant-harvest rounded"></div>
                        <span className="text-sm">Harvest</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Responsive Test */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Breakpoints</CardTitle>
            <CardDescription>Current screen size indicator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-gray-100 rounded">
              <div className="xs:hidden">📱 Mobile (&lt; 475px)</div>
              <div className="hidden xs:block sm:hidden">📱 XS (475px+)</div>
              <div className="hidden sm:block md:hidden">📱 SM (640px+)</div>
              <div className="hidden md:block lg:hidden">💻 MD (768px+)</div>
              <div className="hidden lg:block xl:hidden">🖥️ LG (1024px+)</div>
              <div className="hidden xl:block 2xl:hidden">🖥️ XL (1280px+)</div>
              <div className="hidden 2xl:block">🖥️ 2XL (1536px+)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}