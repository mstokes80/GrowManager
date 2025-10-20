import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Thermometer,
  Droplets,
  TrendingUp,
  GitCompare,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface AnalyticsSection {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  features: string[];
}

const analyticsSections: AnalyticsSection[] = [
  {
    title: 'Environmental Analytics',
    description: 'Track temperature, humidity, VPD, CO₂, and light conditions over time',
    icon: Thermometer,
    path: '/analytics/environmental',
    color: 'text-red-600 dark:text-red-400',
    features: [
      'Temperature & humidity trends',
      'VPD monitoring and analysis',
      'Stage-based environmental comparison',
      'Statistical summaries and stability scores',
    ],
  },
  {
    title: 'Feeding Analytics',
    description: 'Monitor nutrient inputs, pH/EC levels, and feeding efficiency',
    icon: Droplets,
    path: '/analytics/feeding',
    color: 'text-blue-600 dark:text-blue-400',
    features: [
      'Nutrient timeline and totals',
      'pH and EC trend analysis',
      'Feeding frequency tracking',
      'Efficiency metrics and costs',
    ],
  },
  {
    title: 'Yield Analytics',
    description: 'Analyze harvest yields, production efficiency, and quality metrics',
    icon: TrendingUp,
    path: '/analytics/yield',
    color: 'text-green-600 dark:text-green-400',
    features: [
      'Total yield tracking over time',
      'Quality distribution analysis',
      'Top performing cultivars',
      'Production efficiency metrics',
    ],
  },
  {
    title: 'Cultivar Comparison',
    description: 'Compare strain performance across yield, growth speed, and ease of cultivation',
    icon: GitCompare,
    path: '/analytics/comparison',
    color: 'text-purple-600 dark:text-purple-400',
    features: [
      'Side-by-side cultivar metrics',
      'Yield and success rate comparison',
      'Environmental preferences',
      'Growth duration analysis',
    ],
  },
];

/**
 * AnalyticsLandingPage - Central hub for all analytics features
 * Provides an overview and easy access to all analytics sections
 */
export default function AnalyticsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Gain insights into your grows with comprehensive analytics and reporting"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Analytics Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.path}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Features List */}
                  <ul className="space-y-2 mb-4">
                    {section.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* View Analytics Button */}
                  <Button asChild className="w-full">
                    <Link to={section.path}>
                      View Analytics
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline View
            </CardTitle>
            <CardDescription>
              View a comprehensive timeline of all activities for a specific grow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access the timeline view from any grow's detail page to see all activities,
              milestones, and photos in chronological order.
            </p>
            <Button asChild variant="outline">
              <Link to="/grows">
                Go to Grows
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">💡 Pro Tip:</strong> Analytics are
            generated from your tracked environmental snapshots, feeding events, and
            harvest data. The more data you track, the more insights you'll gain!
          </p>
        </div>
      </div>
    </div>
  );
}