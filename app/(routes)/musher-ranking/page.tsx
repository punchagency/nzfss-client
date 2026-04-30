"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';
import { gql, useQuery } from '@apollo/client';

const GET_ALL_POINTS = gql`
  query GetAllPoints {
    getAllPoints {
      _id
      entrantId
      points
      createdAt
      updatedAt
      entrant {
        _id
        name
        raceFormat
        class
        customClass
        associatedDog {
          driverName
          name
          NZFSSRegistration
          dob
          breed
        }
        raceType
        raceTime
        eventId
      }
    }
  }
`;

interface Point {
  _id: string;
  entrantId: string;
  points: number;
  createdAt: string;
  updatedAt: string;
  entrant: {
    _id: string;
    name: string;
    raceFormat: string;
    class: string;
    customClass: string;
    associatedDog: {
      driverName: string;
      name: string;
      NZFSSRegistration: string;
      dob: string;
      breed: string;
    }[];
    raceType: string;
    raceTime: string | null;
    eventId: string;
  } | null;
}

interface Musher {
  rank: number;
  name: string;
  regNumber: string;
  points: number;
  events: number;
  avg: number;
  seasons?: string[];
  raceTime?: string | null;
  raceType?: string;
  class?: string;
  customClass?: string;
  raceFormat?: string;
  temperature?: string;
  distance?: string;
  drivers?: {
    name: string;
    raceTime?: string;
    raceStatus: "Started" | "Did not start" | "Did not qualify";
  }[];
  associatedDog?: {
    driverName: string;
    name: string;
    NZFSSRegistration: string;
    dob: string;
    breed: string;
  }[];
}

interface SubClass {
  title: string;
  mushers: Musher[];
}

interface EventClassData {
  title: string;
  subClasses: Partial<Record<SubClassKey, SubClass>>;
}

interface EventClasses {
  [key: string]: EventClassData;
}

type ClassKey = 'speed' | 'freight' | 'snow' | 'weightPull';
type SubClassKey = 'skijoring' | 'twoDogRig' | 'threeDogRig' | 'fourDogRig' | 'sixDogRig' | 'eightDogRig' | 'openClassRig' | 'singleDogScooter' | 'canicross' | 'bikejoring' | 'weightPull27kg' | 'weightPull36kg' | 'weightPull50kg' | 'weightPullUnlimited';

interface ClassHierarchy {
  title: string;
  subClasses: Partial<Record<SubClassKey, string>>;
}

const VALID_SUBCLASS_KEYS = ['skijoring', 'twoDogRig', 'threeDogRig', 'fourDogRig', 'sixDogRig', 'eightDogRig', 'openClassRig', 'singleDogScooter', 'canicross', 'bikejoring', 'weightPull27kg', 'weightPull36kg', 'weightPull50kg', 'weightPullUnlimited'] as const;

const CLASS_HIERARCHY: Record<ClassKey, ClassHierarchy> = {
  speed: {
    title: "Speed Class",
    subClasses: {
      canicross: "Canicross",
      bikejoring: "Bikejoring",
      skijoring: "Skijoring",
      twoDogRig: "2-Dog Rig",
      threeDogRig: "3-Dog Rig",
      fourDogRig: "4-Dog Rig",
      sixDogRig: "6-Dog Rig",
      eightDogRig: "8-Dog Rig",
      openClassRig: "Open Class Rig"
    }
  },
  freight: {
    title: "Freight Class",
    subClasses: {
      bikejoring: "Bikejoring",
      skijoring: "Skijoring",
      twoDogRig: "2-Dog Rig",
      threeDogRig: "3-Dog Rig",
      fourDogRig: "4-Dog Rig",
      sixDogRig: "6-Dog Rig",
      eightDogRig: "8-Dog Rig",
      openClassRig: "Open Class Rig"
    }
  },
  snow: {
    title: "Snow Class",
    subClasses: {
      canicross: "Canicross",
      bikejoring: "Bikejoring",
      skijoring: "Skijoring",
      twoDogRig: "2-Dog Rig",
      threeDogRig: "3-Dog Rig",
      fourDogRig: "4-Dog Rig",
      sixDogRig: "6-Dog Rig",
      eightDogRig: "8-Dog Rig",
      openClassRig: "Open Class Rig"
    }
  },
  weightPull: {
    title: "Weight Pull Class",
    subClasses: {
      weightPull27kg: "27kg (60 Pound) Class",
      weightPull36kg: "36kg (80 Pound) Class",
      weightPull50kg: "50kg (110 Pounds) Class",
      weightPullUnlimited: "Unlimited Class"
    }
  }
};

const MusherRankingPage = () => {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState(currentYear.toString());
  const [eventClass, setEventClass] = useState<ClassKey | ''>('');
  const [subClass, setSubClass] = useState<SubClassKey | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltered, setIsFiltered] = useState(true);
  const [eventClasses, setEventClasses] = useState<EventClasses>({});
  
  const { loading, error, data } = useQuery(GET_ALL_POINTS);

  useEffect(() => {
    if (data?.getAllPoints) {
      // Group by musher name + class + subclass
      type GroupKey = string;
      interface GroupedMusher {
        name: string;
        regNumber: string;
        classKey: ClassKey;
        subClassKey: SubClassKey;
        points: number[];
        entrant: any;
      }
      const grouped: Record<GroupKey, GroupedMusher> = {};

      data.getAllPoints.forEach((point: Point) => {
        if (!point.entrant) return;
        
        // Normalize the class key properly with better mapping
        const rawClass = (point.entrant.class?.toLowerCase() || '').trim();
        let classKey: ClassKey;
        
        if (rawClass.includes('weight') || rawClass.includes('pull')) {
          classKey = 'weightPull';
        } else if (rawClass.includes('freight')) {
          classKey = 'freight';
        } else if (rawClass.includes('snow')) {
          classKey = 'snow';
        } else if (rawClass.includes('speed') || rawClass === 'speed') {
          classKey = 'speed';
        } else {
          // Default to speed only if we really can't determine the class
          // But log this for debugging
          console.warn('Unknown class detected, defaulting to speed:', rawClass, 'Full entrant:', point.entrant);
          classKey = 'speed';
        }
        
        // Better handling of subclass determination
        let subClassKey: SubClassKey;
        const customClassLower = point.entrant.customClass?.toLowerCase() || '';
        
        // For weight pull class, categorize by weight
        if (classKey === 'weightPull') {
          if (customClassLower.includes('27kg') || customClassLower.includes('60 pound')) {
            subClassKey = 'weightPull27kg';
          } else if (customClassLower.includes('36kg') || customClassLower.includes('80 pound')) {
            subClassKey = 'weightPull36kg';
          } else if (customClassLower.includes('50kg') || customClassLower.includes('110 pound')) {
            subClassKey = 'weightPull50kg';
          } else if (customClassLower.includes('unlimited')) {
            subClassKey = 'weightPullUnlimited';
          } else {
            // Default to unlimited if weight class not specified
            subClassKey = 'weightPullUnlimited';
          }
        } else if (customClassLower === 'canicross') {
          subClassKey = 'canicross';
        } else if (customClassLower.includes('bikejor')) {
          subClassKey = 'bikejoring';
        } else if (customClassLower.includes('3-dog') || 
                  customClassLower.includes('three') || 
                  customClassLower.includes('3 dog')) {
          subClassKey = 'threeDogRig';
        } else if (customClassLower.includes('2-dog') || 
                  customClassLower.includes('two') || 
                  customClassLower.includes('2 dog')) {
          subClassKey = 'twoDogRig';
        } else if (customClassLower.includes('4-dog') || 
                  customClassLower.includes('four') || 
                  customClassLower.includes('4 dog')) {
          subClassKey = 'fourDogRig';
        } else if (customClassLower.includes('6-dog') || 
                  customClassLower.includes('six') || 
                  customClassLower.includes('6 dog')) {
          subClassKey = 'sixDogRig';
        } else if (customClassLower.includes('8-dog') || 
                  customClassLower.includes('eight') || 
                  customClassLower.includes('8 dog')) {
          subClassKey = 'eightDogRig';
        } else if (customClassLower.includes('skijor')) {
          subClassKey = 'skijoring';
        } else if (customClassLower.includes('single') || 
                  customClassLower.includes('1-dog') || 
                  customClassLower.includes('1 dog')) {
          subClassKey = 'singleDogScooter';
        } else {
          // Count dogs for better classification
          const dogCount = point.entrant.associatedDog?.length || 0;
          switch (dogCount) {
            case 1: subClassKey = 'singleDogScooter'; break;
            case 2: subClassKey = 'twoDogRig'; break;
            case 3: subClassKey = 'threeDogRig'; break;
            case 4: subClassKey = 'fourDogRig'; break;
            case 6: subClassKey = 'sixDogRig'; break;
            case 8: subClassKey = 'eightDogRig'; break;
            default: subClassKey = 'openClassRig';
          }
        }
        
        // Debug log to help understand classification
        if (rawClass && !rawClass.includes('speed')) {
          console.log('Classifying entry:', { rawClass, classKey, customClass: point.entrant.customClass, subClassKey });
        }
        
        const name = point.entrant.associatedDog?.[0]?.driverName || 'Unknown';
        const fullRegNumber = point.entrant.associatedDog?.[0]?.NZFSSRegistration || 'N/A';
        // Extract only the registration number part (first two segments before dog name)
        const regNumber = fullRegNumber === 'N/A' ? 'N/A' : 
          fullRegNumber.split('/').slice(0, 2).join('/') || fullRegNumber;
        const groupKey = `${name}__${classKey}__${subClassKey}`;
        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            name,
            regNumber,
            classKey,
            subClassKey: subClassKey as SubClassKey,
            points: [],
            entrant: point.entrant
          };
        }
        grouped[groupKey].points.push(point.points);
      });

      // Build formattedClasses
      const formattedClasses: EventClasses = {};
      Object.values(grouped).forEach(({ name, regNumber, classKey, subClassKey, points, entrant }) => {
        if (!formattedClasses[classKey]) {
          formattedClasses[classKey] = {
            title: CLASS_HIERARCHY[classKey]?.title || classKey,
            subClasses: {}
          };
        }
        if (!formattedClasses[classKey].subClasses[subClassKey]) {
          const hierarchyTitle = CLASS_HIERARCHY[classKey]?.subClasses?.[subClassKey];
          formattedClasses[classKey].subClasses[subClassKey] = {
            title: entrant.customClass || hierarchyTitle || subClassKey,
            mushers: []
          };
        }
        const totalPoints = points.reduce((sum, p) => sum + p, 0);
        const avgPoints = points.length > 0 ? totalPoints / points.length : 0;
        const musher: Musher = {
          rank: 0,
          name,
          regNumber,
          points: totalPoints,
          events: points.length,
          avg: avgPoints,
          raceTime: entrant.raceTime,
          raceType: entrant.raceType,
          class: entrant.class,
          customClass: entrant.customClass,
          raceFormat: entrant.raceFormat,
          associatedDog: entrant.associatedDog,
          seasons: [new Date().getFullYear().toString()]
        };
        formattedClasses[classKey].subClasses[subClassKey].mushers.push(musher);
      });

      // Sort and rank
      Object.values(formattedClasses).forEach(classData => {
        Object.values(classData.subClasses).forEach(subClass => {
          subClass.mushers.sort((a, b) => b.points - a.points);
          subClass.mushers.forEach((musher, index) => {
            musher.rank = index + 1;
          });
        });
      });
      setEventClasses(formattedClasses);
    }
  }, [data, searchTerm, currentYear]);

  // Update to auto-filter without a button
  useEffect(() => {
    setIsFiltered(eventClass !== "" || season !== "" || searchTerm !== "");
  }, [eventClass, subClass, season, searchTerm]);

  const RankingTable = ({ title, mushers }: { title: string, mushers: Musher[] }) => (
    <div className="mb-8 flex justify-center">
      <div className="w-[62.917vw]">
        <div className="bg-[#212529] text-white p-3 rounded-t">
          <h2 className="text-[1.25vw] font-normal">{title}</h2>
        </div>

        <div className="overflow-x-auto border border-[#DEE2E6] rounded-b">
          <table className="w-full">
            <thead className="bg-[#E9ECEF]">
              <tr>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Rank</th>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Musher</th>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Reg#</th>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Points</th>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Events</th>
                <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {mushers.map((musher, index) => (
                <tr key={`${musher.rank}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'}>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.rank}</td>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.name}</td>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.regNumber}</td>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.points}</td>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.events}</td>
                  <td className="px-4 py-2 text-[0.938vw]">{musher.avg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Add helper function for formatting distance
  function formatDistance(distance: string): string {
    if (!distance) return "-";
    const distanceNum = parseFloat(distance);
    if (isNaN(distanceNum)) return distance;
    return distanceNum < 1 
      ? `${(distanceNum * 1000).toFixed(0)}m` 
      : `${distanceNum.toFixed(1)}km`;
  }

  const getFilteredEventClasses = () => {
    if (!isFiltered) return Object.entries(eventClasses);

    const filtered = Object.entries(eventClasses).filter(([key, _]) => {
      if (!eventClass) return true;
      return key === eventClass;
    }).map(([key, classData]) => {
      if (!subClass) return [key, classData];
      
      // Filter subclasses if a specific subclass is selected
      const filteredSubClasses = Object.fromEntries(
        Object.entries(classData.subClasses).filter(([subKey]) => subKey === subClass)
      );
      
      return [key, { ...classData, subClasses: filteredSubClasses }];
    });
    
    return filtered;
  };

  if (loading) {
    console.log('Loading state is true');
    return <div className="flex justify-center items-center min-h-screen">Loading rankings...</div>;
  }

  if (error) {
    console.log('Error occurred:', error);
    return <div className="flex justify-center items-center min-h-screen">Error loading rankings: {error.message}</div>;
  }

  console.log('About to render with data:', {
    hasData: !!data,
    pointsCount: data?.getAllPoints?.length,
    eventClassesCount: Object.keys(eventClasses).length,
    filteredClassesCount: getFilteredEventClasses().length,
    selectedClass: eventClass,
    selectedSubClass: subClass,
    filters: { eventClass, subClass, season, searchTerm }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h1 className="text-[4.375vw] font-bold text-center mb-8">Musher Ranking</h1>
          
          <form className="flex gap-4 mb-8 justify-center" onSubmit={(e) => e.preventDefault()}>
            {/* Add search input for name filtering */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or dog..."
              className="px-4 py-2 border rounded-[16px] w-[30vw] bg-white"
            />
            
            <select 
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-[30vw] bg-white cursor-pointer"
            >
              <option value="">All seasons</option>
              <option value={currentYear.toString()}>{currentYear} (Current)</option>
              <option value={(currentYear - 1).toString()}>{currentYear - 1}</option>
              <option value={(currentYear - 2).toString()}>{currentYear - 2}</option>
            </select>
            
            <select 
              value={eventClass}
              onChange={(e) => {
                setEventClass(e.target.value as ClassKey);
                setSubClass('');
              }}
              className="px-4 py-2 border rounded-[16px] w-[200px] bg-white cursor-pointer"
            >
              <option value="">All event classes</option>
              {Object.entries(CLASS_HIERARCHY).map(([key, data]) => (
                <option key={key} value={key}>{data.title}</option>
              ))}
            </select>

            {eventClass && (
              <select 
                value={subClass}
                onChange={(e) => setSubClass(e.target.value as SubClassKey)}
                className="px-4 py-2 border rounded-[16px] w-[200px] bg-white cursor-pointer"
              >
                <option value="">All subclasses</option>
                {Object.entries(CLASS_HIERARCHY[eventClass].subClasses).map(([key, title]) => (
                  <option key={key} value={key}>{title}</option>
                ))}
              </select>
            )}
          </form>

          <div className="flex flex-col items-center">
            {getFilteredEventClasses().map(([classKey, classData]) => {
              const eventClassData = classData as EventClassData;
              return (
                <div key={classKey as string} className="w-full">
                  <h2 className="text-2xl font-bold mb-4">{eventClassData.title}</h2>
                  {Object.entries(eventClassData.subClasses).map(([subClassKey, subClassData]) => (
                    (!subClass || subClass === subClassKey) && (
                      <RankingTable 
                        key={`${classKey}-${subClassKey}`}
                        title={subClassData.title}
                        mushers={subClassData.mushers}
                      />
                    )
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <Inquires />
      </main>
      <Footer />
    </div>
  );
};

export default MusherRankingPage; 