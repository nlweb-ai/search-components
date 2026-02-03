
import {SearchSession} from '../lib/useHistory';
import { Button } from '@headlessui/react';
import {XMarkIcon, PencilSquareIcon, Bars3Icon} from '@heroicons/react/24/solid'
import { Transition } from '@headlessui/react'
import {useState} from 'react';
import {clsx} from 'clsx';

interface GroupedSessions {
  [site: string]: SearchSession[];
}

function SiteBadge({site} : {site: string}) {
  const siteParts = site.split('.')
  return (
    <div className='px-3 py-2 flex gap-2 items-center text-xs font-medium text-gray-400 uppercase'>
      {siteParts[0]}
    </div>
  )
}

function SessionButton({session, onSelect, onDelete, selected=false} : {session: SearchSession; onSelect: () => void; onDelete: () => void; selected?: boolean}) {
  return (
    <div className={clsx('flex group hover:bg-gray-100 rounded-md overflow-hidden', selected ? 'bg-gray-200/50' : '')}>
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
  selected,
  sessions,
  onSelect,
  onDelete,
  onCreate,
}: {
  selected?: string;
  sessions: SearchSession[];
  onSelect: (session: SearchSession) => void;
  onDelete: (sessionId: string) => void;
  onCreate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(sessions.length > 1);
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
    <div className={clsx('flex-1 flex flex-col  relative z-50 transition-all', isOpen ? 'max-w-70' : 'max-w-12')}>
        <div className='flex flex-col flex-1 overflow-hidden'>
            <div className={
              clsx('absolute right-2 top-0 h-12 flex items-center', !isOpen ? 'left-2 flex justify-center' : '')
            }>
              <Button onClick={() => setIsOpen(!isOpen)} className={'text-gray-400 hover:text-gray-700 transition-colors rounded-lg w-7 h-7 hover:bg-gray-50 flex items-center justify-center'}>
                <Bars3Icon className='size-5'/>
              </Button>
            </div>
            <div className={clsx(
              'border-r min-w-64 bg-gray-50 overflow-y-auto',
              'flex-1 data-closed:opacity-0'
            )}>
              <div className={clsx('h-12 items-center font-medium  p-4 px-5 pb-0 pointer-events-none text-xs text-gray-500 transition-opacity', isOpen ? 'opacity-100' : 'opacity-0')}>
                Chats
              </div>
              <div className='px-2'>
                <Button onClick={onCreate} className={clsx('flex items-center gap-2 text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md truncate', isOpen ? 'w-full' : '')}>
                  <PencilSquareIcon className='size-4 text-gray-400'/>
                  <Transition show={isOpen}>
                    <div>New Chat</div>
                  </Transition>
                </Button>
              </div>
              <Transition show={isOpen}>
                <div className='divide-y'>
                  {Object.entries(groupedSessions).map(([site, siteSessions]) => (
                    <div key={site} className='p-2'>
                      <SiteBadge site={site}/>
                      <div className='space-y-1'>
                        {siteSessions.map((session) => (
                          <SessionButton
                            key={session.sessionId}
                            selected={session.sessionId == selected}
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
              </Transition>
            </div>
        
      </div>
    </div>
  )
}