import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { pagesConfig } from './pages.config';

export default function App() {
  const { Pages, Layout, mainPage } = pagesConfig;

  return (
    <BrowserRouter>
      <Routes>
        {Object.entries(Pages).map(([pageName, PageComponent]) => {
          const path = `/${pageName}`;
          const isMain = pageName === mainPage;
          
          return (
            <React.Fragment key={pageName}>
              <Route
                path={path}
                element={
                  <Layout currentPageName={pageName}>
                    <PageComponent />
                  </Layout>
                }
              />
              {isMain && (
                <Route
                  path="/"
                  element={
                    <Layout currentPageName={pageName}>
                      <PageComponent />
                    </Layout>
                  }
                />
              )}
            </React.Fragment>
          );
        })}
        <Route path="*" element={<Navigate to={`/${mainPage}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
