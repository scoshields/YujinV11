import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { generateWorkout } from '../../services/workouts';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface Equipment {
  name: string;
  exercises: number;
}

const GOALS = [
  { id: '1', name: 'Strength', description: 'Build muscle and increase power (2-6 sets, 3-10 reps)' },
  { id: '2', name: 'Toning', description: 'Improve muscle definition and endurance (2-4 sets, 10-15 reps)' }
];

const BODY_PART_CATEGORIES = {
  'Upper Body': [
    'Abdominals', 'Back', 'Biceps', 'Chest', 'Forearms', 
    'Shoulders', 'Trapezius', 'Triceps'
  ],
  'Lower Body': [
    'Calves', 'Glutes', 'Hamstrings', 'Quadriceps', 
    'Adductors', 'Hip Flexors'
  ]
};

export function WorkoutGenerator({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [availableBodyParts, setAvailableBodyParts] = useState<{name: string; count: number}[]>([]);
  const [equipmentByBodyPart, setEquipmentByBodyPart] = useState<Record<string, Equipment[]>>({});
  const [shareWithPartners, setShareWithPartners] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        // Get all exercises grouped by muscle group
        const { data: exerciseGroups, error: exerciseError } = await supabase
          .from('available_exercises')
          .select('main_muscle_group, id')
          .not('main_muscle_group', 'is', null);

        if (exerciseError) throw exerciseError;
        if (!exerciseGroups) return;

        // Group exercises by muscle group and count them
        const groupedExercises = exerciseGroups.reduce((acc, exercise) => {
          const group = exercise.main_muscle_group.trim();
          if (!acc[group]) {
            acc[group] = { name: group, count: 0 };
          }
          acc[group].count++;
          return acc;
        }, {} as Record<string, { name: string; count: number }>);

        // Convert to array and sort alphabetically
        const sortedGroups = Object.values(groupedExercises)
          .sort((a, b) => a.name.localeCompare(b.name));

        setAvailableBodyParts(sortedGroups);
      } catch (err) {
        console.error('Failed to load muscle groups:', err);
        setError('Failed to load muscle groups. Please try again.');
      }
    };

    loadBodyParts();
  }, []);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const equipmentMap: Record<string, Equipment[]> = {};

        // Get equipment for each selected body part
        for (const bodyPart of selectedBodyParts) {
          const { data, error } = await supabase
            .from('available_exercises')
            .select('primary_equipment')
            .eq('main_muscle_group', bodyPart)
            .order('primary_equipment');

          if (error) throw error;

          // Count exercises per equipment for this body part
          const equipmentCounts = data.reduce((acc, ex) => {
            acc[ex.primary_equipment] = (acc[ex.primary_equipment] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Convert to array and sort by exercise count
          equipmentMap[bodyPart] = Object.entries(equipmentCounts)
            .map(([name, count]) => ({ name, exercises: count }))
            .sort((a, b) => b.exercises - a.exercises);
        }

        setEquipmentByBodyPart(equipmentMap);
      } catch (err) {
        console.error('Failed to load equipment:', err);
      }
    };

    if (selectedBodyParts.length > 0) {
      loadEquipment();
    }
  }, [selectedBodyParts]);

  // Get common equipment across all selected body parts
  const availableEquipment = useMemo(() => {
    if (selectedBodyParts.length === 0) return [];
    
    // Get equipment names from first body part
    const firstBodyPart = equipmentByBodyPart[selectedBodyParts[0]] || [];
    const commonEquipment = new Set(firstBodyPart.map(e => e.name));
    
    // Find intersection with other body parts
    for (let i = 1; i < selectedBodyParts.length; i++) {
      const bodyPartEquipment = new Set(
        (equipmentByBodyPart[selectedBodyParts[i]] || []).map(e => e.name)
      );
      
      // Keep only equipment that exists in both sets
      for (const equipment of commonEquipment) {
        if (!bodyPartEquipment.has(equipment)) {
          commonEquipment.delete(equipment);
        }
      }
    }
    
    // Convert back to array with exercise counts
    return Array.from(commonEquipment).map(name => {
      const totalExercises = selectedBodyParts.reduce((sum, bodyPart) => {
        const equipment = equipmentByBodyPart[bodyPart]?.find(e => e.name === name);
        return sum + (equipment?.exercises || 0);
      }, 0);
      
      return {
        name,
        exercises: Math.floor(totalExercises / selectedBodyParts.length) // Average exercises per body part
      };
    }).sort((a, b) => b.exercises - a.exercises);
  }, [selectedBodyParts, equipmentByBodyPart]);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const { data } = await supabase
          .from('workout_partners')
          .select(`
            partner:users!workout_partners_partner_id_fkey (
              id,
              name
            )
          `)
          .eq('user_id', user?.id)
          .eq('status', 'accepted');

        if (data) {
          setPartners(data.map(p => ({ 
            id: p.partner.id, 
            name: p.partner.name 
          })));
        }
      } catch (err) {
        console.error('Failed to load partners:', err);
      }
    };

    if (user) {
      loadPartners();
    }
  }, [user]);

  const handleNext = async () => {
    if (step < 3) {
      // If moving to equipment selection, validate exercises exist for all body parts
      if (step === 2) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Check each body part for available exercises
          for (const bodyPart of selectedBodyParts) {
            const { data, error } = await supabase
              .from('available_exercises')
              .select('primary_equipment')
              .eq('main_muscle_group', bodyPart);
              
            if (error) throw error;
            if (!data?.length) {
              throw new Error(`No exercises found for ${bodyPart}`);
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to validate exercises';
          setError(errorMessage);
          return;
        } finally {
          setIsLoading(false);
        }
      }
      
      setStep(step + 1);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      const selectedGoalData = GOALS.find(goal => goal.id === selectedGoal);
      if (!selectedGoalData) throw new Error('No goal selected');

      // Set workout type based on goal
      const workoutType = selectedGoalData.id === '1' ? 'strength' : 'weight_loss';

      // Get exercises for all selected body parts and equipment
      const exercises = [];
      
      // Define ranges based on workout type
      const ranges = workoutType === 'strength'
        ? { sets: { min: 3, max: 5 }, reps: { min: 6, max: 12 } }
        : { sets: { min: 2, max: 3 }, reps: { min: 12, max: 15 } };
      
      for (const bodyPart of selectedBodyParts) {
        // Get available exercises for this body part and equipment
        const { data: availableExercises, error: exercisesError } = await supabase
          .from('available_exercises')
          .select('*')
          .eq('main_muscle_group', bodyPart)
          .in('primary_equipment', selectedEquipment)
          .limit(10); // Limit to prevent too many results

        if (exercisesError) throw exercisesError;
        if (!availableExercises?.length) {
          setError(`No exercises found for ${bodyPart} with selected equipment. Please select different equipment.`);
          return;
        }

        // Randomly select exercises for this body part
        const exercisesForBodyPart = availableExercises
          .sort(() => 0.5 - Math.random())
          .slice(0, 2) // Select 2 exercises per body part
          .map(ex => ({
            name: ex.name,
            targetSets: Math.floor(Math.random() * (ranges.sets.max - ranges.sets.min + 1)) + ranges.sets.min,
            targetReps: `${ranges.reps.min}-${ranges.reps.max}`,
            bodyPart: ex.main_muscle_group,
            notes: `Equipment: ${ex.primary_equipment}, Grip: ${ex.grip_style || 'Any'}`
          }));

        exercises.push(...exercisesForBodyPart);
      }
      
      if (exercises.length === 0) {
        setError('No exercises found with the selected criteria. Please try different options.');
        return;
      }

      const workout = await generateWorkout(
        workoutType,
        'medium',
        exercises,
        {
          isShared: shareWithPartners,
          sharedWith: shareWithPartners ? selectedPartners : []
        }
      );

      if (!workout) throw new Error('Failed to generate workout');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate workout';
      console.error('Workout generation error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/90 border border-blue-500/10 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Generate Workout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center mb-4">{error}</p>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((number) => (
              <div key={number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= number ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {number}
                </div>
                {number < 3 && (
                  <div className={`w-24 h-0.5 mx-2 ${
                    step > number ? 'bg-blue-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Select Your Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-4 rounded-lg border ${
                    selectedGoal === goal.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-blue-500/10 hover:border-blue-500/30'
                  } text-left`}
                >
                  <h4 className="text-lg font-medium text-white mb-1">{goal.name}</h4>
                  <p className="text-sm text-gray-400">{goal.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Choose Body Parts</h3>
            <div className="space-y-8">
              {Object.entries(BODY_PART_CATEGORIES).map(([category, muscles]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-400">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {muscles.map(muscleGroup => {
                      const muscleData = availableBodyParts.find(bp => bp.name === muscleGroup);
                      if (!muscleData) return null;
                      
                      return (
                        <button
                          key={muscleGroup}
                          onClick={() => setSelectedBodyParts(prev => 
                            prev.includes(muscleGroup)
                              ? prev.filter(group => group !== muscleGroup)
                              : [...prev, muscleGroup]
                          )}
                          className={`p-4 rounded-lg border ${
                            selectedBodyParts.includes(muscleGroup)
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-blue-500/10 hover:border-blue-500/30'
                          } text-left`}
                        >
                          <h4 className="text-lg font-medium text-white">{muscleGroup}</h4>
                          <p className="text-sm text-gray-400">{muscleData.count} exercises available</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Select Equipment</h3>
            {availableEquipment.length === 0 ? (
              <p className="text-yellow-400 text-center">
                No common equipment found for selected body parts. Please select different body parts or adjust your selection.
              </p>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableEquipment.map((equipment) => (
                <button
                  key={equipment.name}
                  onClick={() => setSelectedEquipment(prev => 
                    prev.includes(equipment.name)
                      ? prev.filter(eq => eq !== equipment.name)
                      : [...prev, equipment.name]
                  )}
                  className={`p-4 rounded-lg border ${
                    selectedEquipment.includes(equipment.name)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-blue-500/10 hover:border-blue-500/30'
                  } text-left`}
                >
                  <h4 className="text-lg font-medium text-white">{equipment.name}</h4>
                  <p className="text-sm text-gray-400">{equipment.exercises} exercises available</p>
                  <p className="text-xs text-gray-500">Available for all selected body parts</p>
                </button>
              ))}
            </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {partners.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="shareWorkout"
                    checked={shareWithPartners}
                    onChange={(e) => setShareWithPartners(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-500/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="shareWorkout" className="text-white">
                    Share this workout with partners
                  </label>
                </div>

                {shareWithPartners && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Select partners to share with:</p>
                    <div className="space-y-2">
                      {partners.map((partner) => (
                        <div key={partner.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`partner-${partner.id}`}
                            checked={selectedPartners.includes(partner.id)}
                            onChange={(e) => {
                              setSelectedPartners(prev =>
                                e.target.checked
                                  ? [...prev, partner.id]
                                  : prev.filter(id => id !== partner.id)
                              );
                            }}
                            className="w-4 h-4 rounded border-blue-500/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                          />
                          <label htmlFor={`partner-${partner.id}`} className="text-white">
                            {partner.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mr-4 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              isLoading ||
              (step === 1 && !selectedGoal) || 
              (step === 2 && selectedBodyParts.length === 0) || 
              (step === 3 && availableEquipment.length > 0 && selectedEquipment.length === 0)
            }
            className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-400 rounded-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} transition-opacity`}
          >
            <span>{isLoading ? 'Generating...' : step === 3 ? 'Generate' : 'Next'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}