===============================================================================
 OUTILS ET VERIFICATION DES FICHIERS JSON - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctions principales
  3. Workflow d'utilisation
  4. Liens et interactions avec l'intégration
  5. Points d’attention & dépannage

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  est destiné :
- à vérifier la validité, la structure et l’intégrité des fichiers JSON utilisés par l’intégration,
- à prévenir les erreurs de formatage qui bloqueraient Home Assistant,
- à détecter et alerter sur la présence de structures Python non sérialisables (typiquement des '!'=0
'#'=0
'$'=1102
'*'=(  )
-=569Xils
0=-zsh
'?'=127
@=(  )
ARGC=0
CDPATH=''
COLORTERM=truecolor
COLUMNS=106
CPUTYPE=arm64
EGID=20
EUID=501
FIGNORE=''
FPATH=/opt/homebrew/share/zsh/site-functions:/usr/local/share/zsh/site-functions:/usr/share/zsh/site-functions:/usr/share/zsh/5.9/functions
FUNCNEST=700
GID=20
HISTCHARS='!^#'
HISTCMD=1045
HISTFILE=/Users/jean/.zsh_sessions/DEDBDBC5-BF3C-437F-90F1-018AE3296650.historynew
HISTSIZE=2000
HOME=/Users/jean
HOMEBREW_CELLAR=/opt/homebrew/Cellar
HOMEBREW_PREFIX=/opt/homebrew
HOMEBREW_REPOSITORY=/opt/homebrew
HOST=Mac-mini-de-jean-3.local
IFS=$' \t\n\C-@'
INFOPATH=/opt/homebrew/share/info:
KEYBOARD_HACK=''
KEYTIMEOUT=40
LANG=C.UTF-8
LC_CTYPE=UTF-8
LINENO=1366
LINES=69
LISTMAX=100
LOGNAME=jean
LaunchInstanceID=107A62E1-E27A-4824-8711-91AE28C3F5B8
MACHTYPE=x86_64
MAILCHECK=60
MAILPATH=''
MANPATH=''
MATCH=c
MBEGIN=1
MEND=1
MODULE_PATH=/usr/lib/zsh/5.9
NULLCMD=cat
OLDPWD=/Users/jean
OPTARG=''
OPTIND=1
OSLogRateLimit=64
OSTYPE=darwin25.0
PATH='/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/Library/Apple/usr/bin:/Applications/VMware Fusion.app/Contents/Public'
PPID=1099
PROMPT='%n@%m %1~ %# '
PROMPT2='%_> '
PROMPT3='?# '
PROMPT4='+%N:%i> '
PS1='%n@%m %1~ %# '
PS2='%_> '
PS3='?# '
PS4='+%N:%i> '
PSVAR=''
PWD=/Volumes/git-lun/dev/home_suivi_elec
RANDOM=5508
READNULLCMD=more
SAVEHIST=1000
SECONDS=100460
SECURITYSESSIONID=186b8
SHELL=/bin/zsh
SHELL_SESSION_DID_HISTORY_CHECK=1
SHELL_SESSION_DID_INIT=1
SHELL_SESSION_DIR=/Users/jean/.zsh_sessions
SHELL_SESSION_FILE=/Users/jean/.zsh_sessions/DEDBDBC5-BF3C-437F-90F1-018AE3296650.session
SHELL_SESSION_HISTFILE=/Users/jean/.zsh_sessions/DEDBDBC5-BF3C-437F-90F1-018AE3296650.history
SHELL_SESSION_HISTFILE_NEW=/Users/jean/.zsh_sessions/DEDBDBC5-BF3C-437F-90F1-018AE3296650.historynew
SHELL_SESSION_HISTFILE_SHARED=/Users/jean/.zsh_history
SHELL_SESSION_HISTORY=1
SHELL_SESSION_TIMESTAMP_FILE=/Users/jean/.zsh_sessions/_expiration_check_timestamp
SHLVL=1
SPROMPT='zsh: correct '\''%R'\'' to '\''%r'\'' [nyae]? '
SSH_AUTH_SOCK=/private/tmp/com.apple.launchd.6vp7yUcC0r/Listeners
TERM=xterm-256color
TERM_PROGRAM=Apple_Terminal
TERM_PROGRAM_VERSION=464
TERM_SESSION_ID=DEDBDBC5-BF3C-437F-90F1-018AE3296650
TIMEFMT='%J  %U user %S system %P cpu %*E total'
TMPDIR=/var/folders/ff/jhnkyjm92vd3ky0pq817nybm0000gn/T/
TMPPREFIX=/tmp/zsh
TRY_BLOCK_ERROR=-1
TRY_BLOCK_INTERRUPT=-1
TTY=/dev/ttys003
TTYIDLE=0
UID=501
USER=jean
USERNAME=jean
VENDOR=apple
WATCH
WORDCHARS='*?_-.[]~=/&;!#$%^(){}<>'
XPC_FLAGS=0x0
XPC_SERVICE_NAME=0
ZSH_ARGZERO=-zsh
ZSH_EVAL_CONTEXT=toplevel:cmdsubst
ZSH_NAME=zsh
ZSH_PATCHLEVEL=zsh-5.9-0-g73d3173
ZSH_SUBSHELL=2
ZSH_VERSION=5.9
_=set
__CFBundleIdentifier=com.apple.Terminal
aliases
argv=(  )
builtins
cdpath=(  )
commands
dirstack
dis_aliases
dis_builtins
dis_functions
dis_functions_source
dis_galiases
dis_patchars
dis_reswords
dis_saliases
fignore=(  )
fpath=( /opt/homebrew/share/zsh/site-functions /usr/local/share/zsh/site-functions /usr/share/zsh/site-functions /usr/share/zsh/5.9/functions )
funcfiletrace
funcsourcetrace
funcstack
functions
functions_source
functrace
galiases
histchars='!^#'
history
historywords
jobdirs
jobstates
jobtexts
key=( [Backspace]=$'\C-H' [Delete]=$'\C-[[3~' [Down]=$'\C-[OB' [End]=$'\C-[OF' [F1]=$'\C-[OP' [F10]=$'\C-[[21~' [F11]=$'\C-[[23~' [F12]=$'\C-[[24~' [F13]=$'\C-[[1;2P' [F14]=$'\C-[[1;2Q' [F15]=$'\C-[[1;2R' [F16]=$'\C-[[1;2S' [F17]=$'\C-[[15;2~' [F18]=$'\C-[[17;2~' [F19]=$'\C-[[18;2~' [F2]=$'\C-[OQ' [F20]=$'\C-[[19;2~' [F3]=$'\C-[OR' [F4]=$'\C-[OS' [F5]=$'\C-[[15~' [F6]=$'\C-[[17~' [F7]=$'\C-[[18~' [F8]=$'\C-[[19~' [F9]=$'\C-[[20~' [Home]=$'\C-[OH' [Insert]=$'\C-[[2~' [Left]=$'\C-[OD' [PageDown]=$'\C-[[6~' [PageUp]=$'\C-[[5~' [Right]=$'\C-[OC' [Up]=$'\C-[OA' )
keymaps
mailpath=(  )
manpath=(  )
module_path=( /usr/lib/zsh/5.9 )
modules
nameddirs
options
parameters
patchars
path=( /opt/homebrew/bin /opt/homebrew/sbin /usr/local/bin /System/Cryptexes/App/usr/bin /usr/bin /bin /usr/sbin /sbin /var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin /var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin /var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin /Library/Apple/usr/bin '/Applications/VMware Fusion.app/Contents/Public' )
pipestatus=( 0 )
precmd_functions=( update_terminal_cwd )
prompt='%n@%m %1~ %# '
psvar=(  )
reswords
saliases
signals=( EXIT HUP INT QUIT ILL TRAP ABRT EMT FPE KILL BUS SEGV SYS PIPE ALRM TERM URG STOP TSTP CONT CHLD TTIN TTOU IO XCPU XFSZ VTALRM PROF WINCH INFO USR1 USR2 ZERR DEBUG )
status=127
termcap
terminfo
userdirs
usergroups
watch
widgets
zle_bracketed_paste=( $'\C-[[?2004h' $'\C-[[?2004l' )
zsh_eval_context=( toplevel cmdsubst )
zsh_scheduled_events
zshexit_functions=( shell_session_update )).

===============================================================================
2. FONCTIONS PRINCIPALES
===============================================================================

-  :
   Parcourt le dossier  à la recherche de fichiers , vérifie si leur contenu est convertible et compatible (pas de set, types attendus).
   Remonte les warnings dans le log HA asynchrone.

-  :
   Lit un fichier JSON dans un thread dédié pour ne pas bloquer la boucle asynchrone Home Assistant.
   Remonte les erreurs de lecture au log.

===============================================================================
3. WORKFLOW D'UTILISATION
===============================================================================

Ce script s’exécute au démarrage ou manuellement via une commande/trigger.
Il scanne tous les fichiers JSON de config/import de l’intégration et alerte via les logs si une structure problématique est rencontrée.

===============================================================================
4. LIENS ET INTERACTIONS AVEC L'INTEGRATION
===============================================================================

Utilisé pour :
- sécuriser toute manipulation ou migration de fichiers JSON critiques
- diagnostiquer rapidement la cause d’une corruption ou d’un mauvais format attribué à une écriture d’un sous-module ou d’une API.

Particulièrement utile lors de scripts de migration ou d’évolution des formats JSON
(voir migration_cleanup.py).

===============================================================================
5. POINTS D’ATTENTION & DÉPANNAGE
===============================================================================

- Si un message "Set détecté" apparaît dans les logs, corriger le format du fichier fautif, uniquement des listes ou objets JSON valides sont autorisés.
- Utilisable à la main pour valider l’intégrité après un débogage ou un import massif de données.

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
