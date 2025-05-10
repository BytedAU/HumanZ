import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Assessment } from "@shared/schema";
import { Loader2, Clock, Users } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssessmentCardProps {
  assessment: Assessment;
  onCompleted?: () => void;
}

export default function AssessmentCard({ assessment, onCompleted }: AssessmentCardProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answer: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Get assessment questions
  const questions = assessment.questions as { id: number; question: string; type: string; min: number; max: number }[];
  
  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: number) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    
    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = { questionId, answer };
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, { questionId, answer }]);
    }
  };
  
  // Get user's answer for a question
  const getUserAnswer = (questionId: number) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer ? answer.answer : null;
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle assessment submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", `/api/assessments/${assessment.id}/complete`, {
        answers: answers
      });
      
      const data = await response.json();
      setResults(data.feedback);
      queryClient.invalidateQueries({ queryKey: ["/api/user-assessments"] });
      
      if (onCompleted) {
        onCompleted();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Close dialog and reset state
  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    setAnswers([]);
    setResults(null);
  };
  
  // Check if current question has an answer
  const isCurrentQuestionAnswered = () => {
    if (!questions[currentStep]) return false;
    return answers.some(a => a.questionId === questions[currentStep].id);
  };
  
  // Get random participant count (in a real app, this would come from the API)
  const getParticipantCount = () => {
    return Math.floor(Math.random() * 1000) + 500;
  };

  return (
    <Card className="h-full shadow-soft hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">{assessment.title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{assessment.description}</p>
        </div>
        <div className="flex items-center justify-center rounded-full bg-muted px-3 py-1 text-xs">
          <Clock className="h-3 w-3 mr-1" /> {assessment.duration} min
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Users className="h-4 w-4 mr-1" /> {getParticipantCount()} completions
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Take Assessment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            {!results ? (
              <>
                <DialogHeader>
                  <DialogTitle>{assessment.title}</DialogTitle>
                  <DialogDescription>
                    {assessment.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  {questions && questions[currentStep] && (
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>Question {currentStep + 1} of {questions.length}</span>
                        <span>{assessment.duration} min</span>
                      </div>
                      
                      <div className="w-full bg-muted h-2 rounded-full mb-6">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        ></div>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4">{questions[currentStep].question}</h3>
                      
                      {questions[currentStep].type === 'scale' && (
                        <RadioGroup
                          value={String(getUserAnswer(questions[currentStep].id))}
                          onValueChange={(value) => handleAnswerSelect(questions[currentStep].id, parseInt(value))}
                          className="grid grid-cols-10 gap-1"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <RadioGroupItem
                                value={String(value)}
                                id={`scale-${value}`}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={`scale-${value}`}
                                className="flex items-center justify-center w-full h-12 border rounded-md cursor-pointer data-[state=checked]:bg-primary data-[state=checked]:text-white hover:bg-muted"
                                data-state={getUserAnswer(questions[currentStep].id) === value ? 'checked' : 'unchecked'}
                              >
                                {value}
                              </Label>
                              {value === 1 && <span className="text-xs mt-1">Not at all</span>}
                              {value === 10 && <span className="text-xs mt-1">Extremely</span>}
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}
                </div>
                
                <DialogFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={!isCurrentQuestionAnswered() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : currentStep === questions.length - 1 ? (
                      "Submit"
                    ) : (
                      "Next"
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Assessment Results</DialogTitle>
                  <DialogDescription>
                    Here's your personalized feedback based on your responses
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle 
                          className="text-muted stroke-current" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50"
                        />
                        <circle 
                          className="text-primary stroke-current" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50" 
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - results.overallScore / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-primary">{results.overallScore}</span>
                        <span className="text-sm text-muted-foreground">Growth Score</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Your Strengths</h3>
                      <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                        {results.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Areas for Improvement</h3>
                      <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                        {results.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Recommended Actions</h3>
                      <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                        {results.suggestedActions.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
