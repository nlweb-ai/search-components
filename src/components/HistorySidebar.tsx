
import {SearchSession} from '../lib/useHistory';
import { Button } from '@headlessui/react';
import {XMarkIcon, GlobeAltIcon, Bars3Icon} from '@heroicons/react/24/solid'
import { Transition } from '@headlessui/react'
import {useState} from 'react';
import {clsx} from 'clsx';

interface GroupedSessions {
  [site: string]: SearchSession[];
}

function SiteBadge({site} : {site: string}) {
  const siteParts = site.split('.')
  return (
    <div className='px-3 py-2 flex gap-2 items-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
      <GlobeAltIcon className='size-3'/> {siteParts[0]}
    </div>
  )
}

function SessionButton({session, onSelect, onDelete} : {session: SearchSession; onSelect: () => void; onDelete: () => void;}) {
  return (
    <div className='flex group hover:bg-gray-100 rounded-md overflow-hidden'>
      <Button
        onClick={onSelect}
        className='w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md truncate'
      >
        {session.query}
      </Button>
      <Button
        onClick={onDelete}
        className='opacity-0 group-hover:opacity-100 px-2 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-md transition-all'
      >
        <XMarkIcon className='size-4'/>
      </Button>
    </div>
  )
} 

export function HistorySidebar({
  sessions,
  onSelect,
  onDelete
}: {
  sessions: SearchSession[];
  onSelect: (session: SearchSession) => void;
  onDelete: (sessionId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  // Group sessions by site
  const groupedSessions: GroupedSessions = sessions.reduce((acc, session) => {
    const site = session.backend.site;
    if (!acc[site]) {
      acc[site] = [];
    }
    acc[site].push(session);
    return acc;
  }, {} as GroupedSessions);

  return (
    <div className='relative z-50'>
      <div className={
        clsx('absolute -right-10 top-0 h-12 flex items-center')
      }>
        <Button onClick={() => setIsOpen(!isOpen)} className={'text-gray-400 hover:text-gray-700 transition-colors rounded-lg w-7 h-7 hover:bg-gray-50 flex items-center justify-center'}>
          <Bars3Icon className='size-5'/>
        </Button>
      </div>
      <Transition show={isOpen}>
        <div className={clsx(
          'min-w-64 border-r h-full bg-gray-50 overflow-y-auto',
          'data-enter:duration-100 data-enter:data-closed:-translate-x-full',
            // Leaving styles
          'data-leave:duration-300 data-leave:data-closed:-translate-x-full',
        )}>
          <div className='h-12 items-center font-medium border-b  p-4 pb-0 text-xs text-gray-500 '>
            Search History
          </div>

          <div className='divide-y'>
            {Object.entries(groupedSessions).map(([site, siteSessions]) => (
              <div key={site} className='p-2'>
                <SiteBadge site={site}/>
                <div className='space-y-1'>
                  {siteSessions.map((session) => (
                    <SessionButton
                      key={session.sessionId}
                      session={session}
                      onSelect={() => onSelect(session)}
                      onDelete={() => onDelete(session.sessionId)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className='px-3 py-8 text-sm text-gray-500 text-center'>
                No search history yet
              </div>
            )}
          </div>
        </div>
      </Transition>
    </div>
  )
}