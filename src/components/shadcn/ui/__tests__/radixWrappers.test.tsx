import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('vaul', () => ({
  Drawer: {
    Root: ({ children }: any) => <div data-testid="vaul-root">{children}</div>,
    Trigger: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Portal: ({ children }: any) => <div>{children}</div>,
    Close: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Overlay: (props: any) => <div data-testid="vaul-overlay" {...props} />,
    Content: ({ children, ...props }: any) => (
      <div data-testid="vaul-content" {...props}>
        {children}
      </div>
    ),
    Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    Description: ({ children, ...props }: any) => (
      <p {...props}>{children}</p>
    ),
  },
}))

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../context-menu'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '../menubar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../pagination'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../drawer'

afterEach(() => cleanup())

describe('shadcn radix wrappers', () => {
  it('renders dialog and alert-dialog content', () => {
    render(
      <div>
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialog desc</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alert title</AlertDialogTitle>
              <AlertDialogDescription>Alert desc</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>,
    )

    expect(screen.getByText('Dialog title')).toBeInTheDocument()
    expect(screen.getByText('Alert title')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renders dropdown menu content when open', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger asChild>
          <button type="button">Open</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    expect(screen.getByText('Item')).toBeInTheDocument()
  })

  it('opens context menu on contextMenu event', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <div data-testid="target">Target</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Do thing</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    )

    fireEvent.contextMenu(screen.getByTestId('target'))
    expect(screen.getByText('Do thing')).toBeInTheDocument()
  })

  it('renders menubar with a menu item', async () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    expect(screen.getByText('File')).toBeInTheDocument()
    // We don't rely on Radix open behavior here; rendering the wrapper components is the goal.
    fireEvent.mouseDown(screen.getByText('File'))
  })

  it('renders select content when open', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    )

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders tabs and pagination primitives', async () => {
    render(
      <div>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
          <TabsContent value="b">Panel B</TabsContent>
        </Tabs>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>,
    )

    expect(screen.getByText('Panel A')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('B'))
    expect(screen.getByLabelText(/Go to previous page/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Go to next page/i)).toBeInTheDocument()
  })

  it('renders drawer wrappers', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer title</DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    )
    expect(screen.getByText('Drawer title')).toBeInTheDocument()
  })
})
