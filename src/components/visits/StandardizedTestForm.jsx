"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calculator } from "lucide-react";

const BERG_BALANCE_ITEMS = [
  "Sitting to standing",
  "Standing unsupported",
  "Sitting unsupported",
  "Standing to sitting",
  "Transfers",
  "Standing with eyes closed",
  "Standing with feet together",
  "Reaching forward with outstretched arm",
  "Retrieving object from floor",
  "Turning to look behind",
  "Turning 360 degrees",
  "Placing alternate foot on stool",
  "Standing with one foot in front",
  "Standing on one foot"
];

const TUG_INTERPRETATION = (seconds) => {
  if (!seconds) return "";
  if (seconds < 10) return "Normal mobility";
  if (seconds <= 20) return "Good mobility, can go out alone, mobile without gait aid";
  if (seconds <= 30) return "Problems, cannot go outside alone, requires gait aid";
  return "Severe mobility impairment";
};

const BERG_INTERPRETATION = (score) => {
  if (!score && score !== 0) return "";
  if (score >= 41) return "Low fall risk";
  if (score >= 21) return "Medium fall risk";
  return "High fall risk";
};

const FIM_ITEMS = [
  { category: "Self-Care", items: ["Eating", "Grooming", "Bathing", "Dressing - Upper", "Dressing - Lower", "Toileting"] },
  { category: "Sphincter Control", items: ["Bladder Management", "Bowel Management"] },
  { category: "Transfers", items: ["Bed/Chair/Wheelchair", "Toilet", "Tub/Shower"] },
  { category: "Locomotion", items: ["Walk/Wheelchair", "Stairs"] },
  { category: "Communication", items: ["Comprehension", "Expression"] },
  { category: "Social Cognition", items: ["Social Interaction", "Problem Solving", "Memory"] }
];

const TINETTI_BALANCE = [
  { name: "Sitting balance", desc: "Patient seated in hard, armless chair. Leans or slides in chair = 0, Steady, safe = 1" },
  { name: "Arising from chair", desc: "Unable without help = 0, Able using arms = 1, Able without using arms = 2" },
  { name: "Attempts to arise", desc: "Unable without help = 0, Able but requires >1 attempt = 1, Able to rise with 1 attempt = 2" },
  { name: "Immediate standing balance (first 5 seconds)", desc: "Unsteady/grabs object = 0, Steady with walker/cane = 1, Steady without support = 2" },
  { name: "Standing balance", desc: "Unsteady = 0, Steady but wide stance/uses support = 1, Narrow stance without support = 2" },
  { name: "Nudge", desc: "Give light push 3x on sternum with feet as close as possible. Begins to fall = 0, Staggers/grabs = 1, Steady = 2" },
  { name: "Eyes closed", desc: "At maximum position with feet as close as possible. Unsteady = 0, Steady = 1" },
  { name: "Turning 360 degrees", desc: "Discontinuous steps = 0, Continuous steps = 1; Unsteady = 0, Steady = 1" },
  { name: "Sitting down", desc: "Unsafe/misjudges distance/falls = 0, Uses arms/not smooth = 1, Safe, smooth motion = 2" }
];

const TINETTI_GAIT = [
  { name: "Initiation of gait", desc: "After told to 'go'. Hesitates/multiple attempts = 0, No hesitation = 1" },
  { name: "Step length and height - Right foot", desc: "Does not pass left foot = 0, Passes left foot = 1; Foot not clear off floor = 0, Foot clears floor = 1" },
  { name: "Step length and height - Left foot", desc: "Does not pass right foot = 0, Passes right foot = 1; Foot not clear off floor = 0, Foot clears floor = 1" },
  { name: "Step symmetry", desc: "Right and left step length unequal = 0, Appears equal = 1" },
  { name: "Step continuity", desc: "Stopping/discontinuous between steps = 0, Steps appear continuous = 1" },
  { name: "Path (observed over about 10 feet)", desc: "Marked deviation = 0, Mild/moderate deviation or uses aid = 1, Straight without aid = 2" },
  { name: "Trunk", desc: "Marked sway or uses aid = 0, No sway but flexion/uses arms/spreads = 1, No sway/flex/arms/spread = 2" },
  { name: "Walking stance", desc: "Heels apart = 0, Heels almost touching = 1" }
];

export default function StandardizedTestForm({ tests = [], onChange }) {
  const [selectedTest, setSelectedTest] = useState("");
  const [currentTest, setCurrentTest] = useState(null);

  const addTest = (testType) => {
    if (!testType) return;

    const newTest = {
      id: Date.now().toString(),
      type: testType,
      date: new Date().toISOString().split("T")[0],
      scores: {},
      calculated_score: null,
      interpretation: ""
    };

    setCurrentTest(newTest);
    setSelectedTest("");
  };

  const saveTest = () => {
    if (!currentTest) return;

    let finalTest = { ...currentTest };

    if (currentTest.type === "berg_balance") {
      const total = Object.values(currentTest.scores).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      finalTest.calculated_score = total;
      finalTest.interpretation = BERG_INTERPRETATION(total);
    } else if (currentTest.type === "tug") {
      const seconds = parseFloat(currentTest.scores.time);
      finalTest.calculated_score = seconds;
      finalTest.interpretation = TUG_INTERPRETATION(seconds);
    } else if (currentTest.type === "6mwt") {
      finalTest.calculated_score = parseInt(currentTest.scores.distance) || 0;
    } else if (currentTest.type === "fim") {
      const total = Object.values(currentTest.scores).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
      finalTest.calculated_score = total;
      finalTest.interpretation = total >= 108 ? "Independent" : total >= 90 ? "Modified independence" : "Requires assistance";
    } else if (currentTest.type === "tinetti") {
      const balanceTotal = Object.entries(currentTest.scores)
        .filter(([key]) => key.startsWith("balance_"))
        .reduce((sum, [, val]) => sum + (parseInt(val) || 0), 0);
      const gaitTotal = Object.entries(currentTest.scores)
        .filter(([key]) => key.startsWith("gait_"))
        .reduce((sum, [, val]) => sum + (parseInt(val) || 0), 0);
      finalTest.calculated_score = balanceTotal + gaitTotal;
      finalTest.scores.balance_score = balanceTotal;
      finalTest.scores.gait_score = gaitTotal;
      finalTest.interpretation = finalTest.calculated_score < 19 ? "High fall risk" : finalTest.calculated_score <= 24 ? "Medium fall risk" : "Low fall risk";
    } else if (currentTest.type === "functional_reach") {
      const inches = parseFloat(currentTest.scores.distance);
      finalTest.calculated_score = inches;
      finalTest.interpretation = !inches ? "" : inches < 7 ? "High fall risk" : inches <= 10 ? "Moderate fall risk" : "Low fall risk";
    } else if (currentTest.type === "sit_to_stand_30") {
      const reps = parseInt(currentTest.scores.repetitions);
      finalTest.calculated_score = reps;
      finalTest.interpretation = currentTest.scores.interpretation || "";
    }

    onChange([...tests, finalTest]);
    setCurrentTest(null);
  };

  const removeTest = (id) => {
    onChange(tests.filter(t => t.id !== id));
  };

  const updateScore = (key, value) => {
    setCurrentTest({
      ...currentTest,
      scores: { ...currentTest.scores, [key]: value }
    });
  };

  const getTestName = (type) => {
    const names = {
      berg_balance: "Berg Balance Scale",
      tug: "Timed Up and Go (TUG)",
      "6mwt": "6 Minute Walk Test",
      fim: "Functional Independence Measure (FIM)",
      tinetti: "Tinetti Assessment Tool",
      functional_reach: "Functional Reach Test",
      sit_to_stand_30: "30 Second Sit to Stand Test"
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-4">
      {tests.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Completed Tests</Label>
          {tests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
              <div className="flex-1">
                <div className="font-medium text-sm">{getTestName(test.type)}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Date: {test.date} - Score: {test.calculated_score}
                  {test.interpretation && ` - ${test.interpretation}`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTest(test.id)}
                className="h-8 w-8 text-slate-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!currentTest && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Add Standardized Test</Label>
          <div className="flex gap-2">
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="berg_balance">Berg Balance Scale</SelectItem>
                <SelectItem value="tug">Timed Up and Go (TUG)</SelectItem>
                <SelectItem value="6mwt">6 Minute Walk Test</SelectItem>
                <SelectItem value="fim">FIM (Functional Independence Measure)</SelectItem>
                <SelectItem value="tinetti">Tinetti Assessment Tool</SelectItem>
                <SelectItem value="functional_reach">Functional Reach Test</SelectItem>
                <SelectItem value="sit_to_stand_30">30 Second Sit to Stand Test</SelectItem>
                </SelectContent>
            </Select>
            <Button type="button" onClick={() => addTest(selectedTest)} disabled={!selectedTest}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}

      {currentTest && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{getTestName(currentTest.type)}</CardTitle>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentTest(null)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={saveTest} className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="w-3 h-3 mr-1" /> Calculate & Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Test Date</Label>
                <Input
                  type="date"
                  value={currentTest.date}
                  onChange={(e) => setCurrentTest({ ...currentTest, date: e.target.value })}
                  className="max-w-xs"
                />
              </div>

              {currentTest.type === "berg_balance" && (
                <div>
                  <div className="text-sm text-slate-600 mb-3">Score each item from 0-4 (0=unable, 4=independent)</div>
                  <div className="space-y-2">
                    {BERG_BALANCE_ITEMS.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_100px] gap-3 items-center">
                        <Label className="text-sm">{idx + 1}. {item}</Label>
                        <Select
                          value={currentTest.scores[`item_${idx}`] || ""}
                          onValueChange={(v) => updateScore(`item_${idx}`, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Score" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium">Total Score: {Object.values(currentTest.scores).reduce((sum, val) => sum + (parseInt(val) || 0), 0)}/56</div>
                  </div>
                </div>
              )}

              {currentTest.type === "tug" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Time (seconds)</Label>
                    <Input type="number" step="0.1" placeholder="Enter time in seconds" value={currentTest.scores.time || ""} onChange={(e) => updateScore("time", e.target.value)} className="max-w-xs" />
                  </div>
                  <div>
                    <Label className="text-sm">Assistive Device</Label>
                    <Input placeholder="e.g., walker, cane, none" value={currentTest.scores.device || ""} onChange={(e) => updateScore("device", e.target.value)} className="max-w-xs" />
                  </div>
                </div>
              )}

              {currentTest.type === "6mwt" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Distance (feet or meters)</Label>
                    <Input type="number" placeholder="Enter distance" value={currentTest.scores.distance || ""} onChange={(e) => updateScore("distance", e.target.value)} className="max-w-xs" />
                  </div>
                  <div>
                    <Label className="text-sm">Unit</Label>
                    <Select value={currentTest.scores.unit || "feet"} onValueChange={(v) => updateScore("unit", v)}>
                      <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feet">Feet</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Rest Breaks</Label>
                    <Input type="number" placeholder="Number of rest breaks" value={currentTest.scores.rest_breaks || ""} onChange={(e) => updateScore("rest_breaks", e.target.value)} className="max-w-xs" />
                  </div>
                </div>
              )}

              {currentTest.type === "fim" && (
                <div>
                  <div className="text-sm text-slate-600 mb-3">Score each item from 1-7 (1=total assist, 7=complete independence)</div>
                  <div className="space-y-4">
                    {FIM_ITEMS.map((category, catIdx) => (
                      <div key={catIdx}>
                        <div className="font-medium text-sm text-slate-700 mb-2">{category.category}</div>
                        <div className="space-y-2 ml-3">
                          {category.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="grid grid-cols-[1fr_100px] gap-3 items-center">
                              <Label className="text-sm">{item}</Label>
                              <Select value={currentTest.scores[`${catIdx}_${itemIdx}`] || ""} onValueChange={(v) => updateScore(`${catIdx}_${itemIdx}`, v)}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Score" /></SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5,6,7].map(n => (
                                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium">Total Score: {Object.values(currentTest.scores).reduce((sum, val) => sum + (parseInt(val) || 0), 0)}/126</div>
                  </div>
                </div>
              )}

              {currentTest.type === "functional_reach" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    Patient stands next to wall without touching it. Reach forward as far as possible without taking a step. Measure distance reached.
                  </div>
                  <div>
                    <Label className="text-sm">Reach Distance (inches)</Label>
                    <Input type="number" step="0.5" placeholder="Enter distance in inches" value={currentTest.scores.distance || ""} onChange={(e) => updateScore("distance", e.target.value)} className="max-w-xs" />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-xs text-slate-600">
                    <strong>Norms:</strong> &lt;7 in = High fall risk | 7-10 in = Moderate fall risk | &gt;10 in = Low fall risk
                  </div>
                </div>
              )}

              {currentTest.type === "sit_to_stand_30" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    Patient sits in chair with arms crossed over chest. Count how many times they can fully stand and sit in 30 seconds.
                  </div>
                  <div>
                    <Label className="text-sm">Number of Repetitions</Label>
                    <Input type="number" placeholder="Enter number of stands completed" value={currentTest.scores.repetitions || ""} onChange={(e) => updateScore("repetitions", e.target.value)} className="max-w-xs" />
                  </div>
                  <div>
                    <Label className="text-sm">Assistive Device Used</Label>
                    <Input placeholder="e.g., none, cane" value={currentTest.scores.device || ""} onChange={(e) => updateScore("device", e.target.value)} className="max-w-xs" />
                  </div>
                  <div>
                    <Label className="text-sm">Clinical Interpretation / Notes</Label>
                    <Input placeholder="e.g., Below average for age group" value={currentTest.scores.interpretation || ""} onChange={(e) => updateScore("interpretation", e.target.value)} />
                  </div>
                </div>
              )}

              {currentTest.type === "tinetti" && (
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-sm text-slate-700 mb-2">Balance Assessment</div>
                    <div className="space-y-3">
                      {TINETTI_BALANCE.map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-slate-50">
                          <div className="grid grid-cols-[1fr_100px] gap-3 items-start mb-1">
                            <Label className="text-sm font-medium">{item.name}</Label>
                            <Select value={currentTest.scores[`balance_${idx}`] || ""} onValueChange={(v) => updateScore(`balance_${idx}`, v)}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Score" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-sm text-slate-700 mb-2">Gait Assessment</div>
                    <div className="space-y-3">
                      {TINETTI_GAIT.map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-3 bg-slate-50">
                          <div className="grid grid-cols-[1fr_100px] gap-3 items-start mb-1">
                            <Label className="text-sm font-medium">{item.name}</Label>
                            <Select value={currentTest.scores[`gait_${idx}`] || ""} onValueChange={(v) => updateScore(`gait_${idx}`, v)}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Score" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium">
                      Balance: {Object.entries(currentTest.scores).filter(([k]) => k.startsWith("balance_")).reduce((sum, [, val]) => sum + (parseInt(val) || 0), 0)}/16
                    </div>
                    <div className="text-sm font-medium">
                      Gait: {Object.entries(currentTest.scores).filter(([k]) => k.startsWith("gait_")).reduce((sum, [, val]) => sum + (parseInt(val) || 0), 0)}/12
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
