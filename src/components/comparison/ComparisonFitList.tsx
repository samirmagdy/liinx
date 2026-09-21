import React from 'react';
import { useLanguage as useUiLanguage } from '../../context/LanguageContext';

/**
 * Each line here describes something the product does today, in the words a creator would
 * recognise. Nothing is compared to a rival, because a rival's feature list has not been
 * assessed by us and inventing one is the failure this section used to have.
 */
export const ComparisonFitList: React.FC = () => {
  const { tr: ui } = useUiLanguage();

  const fits = [
    {
      title: ui('You have more than a few things to point at'),
      detail: ui('Pages and folders keep a launch, a shop and a booking link from competing in one long scroll.')
    },
    {
      title: ui('You want to be reached at your own address'),
      detail: ui('The domain wizard shows the one record to add and tells you exactly what DNS answered.')
    },
    {
      title: ui('You want visitors to leave something behind'),
      detail: ui('Newsletter blocks collect emails and forms collect responses, each with consent recorded against it.')
    },
    {
      title: ui('You publish in Arabic'),
      detail: ui('Every screen is laid out right-to-left first, so Arabic reads the way it was written rather than mirrored.')
    },
    {
      title: ui('You keep your links somewhere else'),
      detail: ui('The REST API reads your profile and creates or removes link blocks, so a spreadsheet can stay the source.')
    },
    {
      title: ui('You care how the page looks'),
      detail: ui('Curated themes on every plan, and your own CSS and webfont once you are paying.')
    }
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fits.map(fit => (
        <li key={fit.title} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900">{fit.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{fit.detail}</p>
        </li>
      ))}
    </ul>
  );
};
