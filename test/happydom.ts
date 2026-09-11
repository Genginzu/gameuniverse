/**
 * Preload 1: Register happy-dom globals BEFORE any other module is imported.
 * This file must have NO imports that depend on DOM globals.
 * It is listed first in bunfig.toml [test].preload.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
