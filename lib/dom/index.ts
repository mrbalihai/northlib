import { SideEffect } from '../fp';
import { Option, none, some, map } from '../fp/option';

export type StyleObject = Partial<Record<keyof CSSStyleDeclaration, string>>;
export type Style = (styles: StyleObject) => SideEffect<Option<HTMLElement>>;
export type AddEventListener = (
  eventType: string,
  handler: SideEffect<Event>,
) => SideEffect<Option<HTMLElement | (Window & typeof globalThis)>>;
export type GetElementsByTagName = <T extends HTMLElement>(
  tagName: string,
) => Option<T[]>;
export type GetFirstElementByTagName = <T extends HTMLElement>(
  tagName: string,
) => Option<T>;
export type GetElementById = <T extends HTMLElement>(id: string) => Option<T>;

export const style: Style = (styles) => (element) => {
  map(element, (a) => {
    for (const property in styles) {
      const value = styles[property];
      if (value !== undefined) a.style.setProperty(property, value);
    }
  });
};

export const addEventListener: AddEventListener =
  <T extends HTMLElement | (Window & typeof globalThis)>(
    eventType: string,
    handler: SideEffect<Event>,
  ) =>
  (element: Option<T>) =>
    map(element, (el) => el.addEventListener(eventType, handler));

export const getElementsByTagName: GetElementsByTagName = <
  T extends HTMLElement,
>(
  tagName: string,
) => {
  const elements = document.getElementsByTagName(tagName);
  return elements.length === 0 ? none : some(Array.from(elements) as T[]);
};

export const getFirstElementByTagName: GetFirstElementByTagName = <
  T extends HTMLElement,
>(
  tagName: string,
) => {
  const elements = document.getElementsByTagName(tagName);
  return elements.length === 0 ? none : some(elements[0] as T);
};

export const getElementById: GetElementById = <T extends HTMLElement>(
  id: string,
) => {
  const element = document.getElementById(id);
  return element ? some(element as T) : none;
};
