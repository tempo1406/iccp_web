import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { lowConfidenceAnswers, topQuestions } from './analytics-data';

export function AnalyticsInsightsTabs() {
  const t = useTranslations('analytics');

  return (
    <Tabs defaultValue="top-questions" className="space-y-4">
      <TabsList>
        <TabsTrigger value="top-questions">{t('insights.tabs.topQuestions')}</TabsTrigger>
        <TabsTrigger value="low-confidence">{t('insights.tabs.lowConfidence')}</TabsTrigger>
      </TabsList>

      <TabsContent value="top-questions">
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.topQuestions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>{t('insights.table.query')}</TableHead>
                  <TableHead className="text-right">{t('insights.table.count')}</TableHead>
                  <TableHead className="text-right">{t('insights.table.confidence')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topQuestions.map((q, i) => (
                  <TableRow key={q.query}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{q.query}</TableCell>
                    <TableCell className="text-right">
                      {q.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={
                          q.confidence >= 90
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }
                      >
                        {q.confidence}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="low-confidence">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('insights.lowConfidence.title')}
            </CardTitle>
            <Button variant="outline" size="sm">
              {t('insights.lowConfidence.reviewAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('insights.table.query')}</TableHead>
                  <TableHead>{t('insights.table.department')}</TableHead>
                  <TableHead>{t('insights.table.time')}</TableHead>
                  <TableHead className="text-right">{t('insights.table.confidence')}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowConfidenceAnswers.map((answer) => (
                  <TableRow key={`${answer.query}-${answer.timestamp}`}>
                    <TableCell className="max-w-[300px] truncate">
                      {answer.query}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{answer.department}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {answer.timestamp}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                        {answer.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
