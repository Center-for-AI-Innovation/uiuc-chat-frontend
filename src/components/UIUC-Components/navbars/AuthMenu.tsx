import { Menu, Avatar, type MantineNumberSize, rem } from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { montserrat_heading } from 'fonts'
import { createStyles } from '@mantine/core'
import { initiateSignIn } from '~/utils/authHelpers'

const useStyles = createStyles((theme) => ({
    link: {
        fontSize: rem(13),
        color: '#c1c2c5',
        padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
        fontWeight: 700,
        transition: 'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
        borderRadius: theme.radius.sm,
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent',

        '&:hover': {
            color: 'hsl(280,100%,70%)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            textDecoration: 'none',
            borderRadius: '10px',
        },
        '&[data-active="true"]': {
            color: 'hsl(280,100%,70%)',
            borderBottom: '2px solid hsl(280,100%,70%)',
            textDecoration: 'none',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
    },
    userAvatar: {
        cursor: 'pointer',
        transition: 'all 200ms ease',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&::after': {
                transform: 'translateX(100%)',
            }
        },
        '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, transparent 0%, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%, transparent 100%)',
            transform: 'translateX(-100%)',
            transition: 'transform 650ms ease',
        }
    },
    userMenu: {
        backgroundColor: '#1a1b38',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        '.mantine-Menu-item': {
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '10px 16px',
            margin: '2px 0',
            fontWeight: 500,
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
        },
    },
}))

const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length >= 2) {
        return `${names[0]?.[0] || ''}${names[names.length - 1]?.[0] || ''}`.toUpperCase()
    }
    return (names[0]?.[0] || '').toUpperCase()
}

interface AuthMenuProps {
    size?: MantineNumberSize
}

export const AuthMenu = ({ size = 34 }: AuthMenuProps) => {
    const { classes } = useStyles()
    const auth = useAuth()

    if (auth.isAuthenticated) {
        return (
            <Menu
                position="bottom-end"
                offset={5}
                classNames={{
                    dropdown: classes.userMenu
                }}
            >
                <Menu.Target>
                    <Avatar
                        size={size}
                        radius="xl"
                        variant='gradient'
                        gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                        className={classes.userAvatar}
                    >
                        {getInitials(auth.user?.profile.name || '')}
                    </Avatar>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item
                        onClick={() => {
                            // Fixed URL construction to avoid realm duplication
                            window.open(
                                `https://login.uiuc.chat/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/account`,
                                '_blank'
                            )
                        }}
                    >
                        Manage Account
                    </Menu.Item>
                    <Menu.Item onClick={() => auth.signoutRedirect()}>
                        Sign Out
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        )
    }

    return (
        <button
            className={classes.link}
            onClick={() => void initiateSignIn(auth, window.location.pathname)}
        >
            <div
                className={`${montserrat_heading.variable} font-montserratHeading`}
                style={{ fontSize: '14px' }}
            >
                Sign in
            </div>
        </button>
    )
}