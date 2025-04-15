import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { GraduationCap, Info, Search } from 'lucide-react';
import { DroneRuleExplainer } from '@/components/ai/DroneRuleExplainer';
import { DroneFact } from '@/components/ai/DroneFact';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { droneRuleTopics } from '@/lib/geminiApi';

export default function Learn() {
  const [selectedTopic, setSelectedTopic] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter topics based on search query
  const filteredTopics = searchQuery.trim() === '' 
    ? droneRuleTopics 
    : droneRuleTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="py-6 px-6 lg:px-8">
      <Helmet>
        <title>Learn - Drone Companion</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-secondary-900 flex items-center">
          <GraduationCap className="mr-2 h-6 w-6" />
          Learn about Drone Regulations
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Understand UK drone laws and guidelines with AI-powered explanations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Topics */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Rule Topics</CardTitle>
              <CardDescription>Select a topic to learn more</CardDescription>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              <div className="space-y-2">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedTopic === topic.id 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <div className="font-medium">{topic.title}</div>
                    <div className={`text-sm ${selectedTopic === topic.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {topic.description}
                    </div>
                  </div>
                ))}
                {filteredTopics.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No topics match your search
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Drone Fact Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Drone Fact of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DroneFact />
            </CardContent>
          </Card>
        </div>

        {/* Main content - Rule explanation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {droneRuleTopics.find(topic => topic.id === selectedTopic)?.title || 'Drone Rules Overview'}
                </CardTitle>
                <div className="lg:hidden">
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {droneRuleTopics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                {droneRuleTopics.find(topic => topic.id === selectedTopic)?.description || ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DroneRuleExplainer topicId={selectedTopic} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}