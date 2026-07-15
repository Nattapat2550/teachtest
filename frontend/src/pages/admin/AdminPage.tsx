import React, { useState } from 'react';
import UsersTab from './tabs/UsersTab';
import NewsTab from './tabs/NewsTab';
import AppealsTab from './tabs/AppealsTab';
import CarouselTab from './tabs/CarouselTab';
import DocumentsTab from './tabs/DocumentsTab';

import userImg from '../../assets/user.png';
import ideaImg from '../../assets/idea.png';
import settingsImg from '../../assets/settings.png';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="w-full min-h-screen bg-canvas  p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="bg-white  rounded-md shadow-sm border border-gray-200  overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200  bg-white  sticky top-0 z-10">
          <h2 className="text-3xl font-black text-gray-900  flex items-center gap-3">
            <img src={settingsImg} alt="Admin" className="w-8 h-8 dark:invert opacity-80" />
            Admin Dashboard
          </h2>
          
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            <TabButton id="users" label="ผู้ใช้งาน" active={activeTab} onClick={setActiveTab} icon={userImg} />
            <TabButton id="news" label="ข่าวสาร" active={activeTab} onClick={setActiveTab} icon={ideaImg} />
            <TabButton id="appeals" label="คำร้องเรียน" active={activeTab} onClick={setActiveTab} icon={ideaImg} />
            <TabButton id="carousel" label="แบนเนอร์" active={activeTab} onClick={setActiveTab} icon={ideaImg} />
            <TabButton id="documents" label="เอกสาร" active={activeTab} onClick={setActiveTab} icon={ideaImg} />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-canvas/50 /30 min-h-[70vh] animate-fade-in">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'news' && <NewsTab />}
          {activeTab === 'appeals' && <AppealsTab />}
          {activeTab === 'carousel' && <CarouselTab />}
          {activeTab === 'documents' && <DocumentsTab />}
        </div>
        
      </div>
    </div>
  );
}

function TabButton({ id, label, active, onClick, icon }: { id: string, label: string, active: string, onClick: (id: string) => void, icon: string }) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-200 shadow-sm border ${
        isActive 
          ? 'bg-primary text-white border-blue-600 shadow-blue-500/30 hover:bg-primary-active' 
          : 'bg-white text-gray-600 border-gray-200 hover:bg-canvas hover:border-gray-300    dark:hover:bg-gray-700'
      }`}
    >
      <img 
        src={icon} 
        alt={label} 
        className={`w-5 h-5 object-contain ${isActive ? 'brightness-0 invert' : 'dark:invert opacity-70'}`} 
      />
      {label}
    </button>
  );
}