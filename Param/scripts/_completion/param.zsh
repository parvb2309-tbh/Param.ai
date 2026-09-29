#compdef param param-backup param-calendar param-contacts param-cookbook param-docs param-gallery param-mail param-mcp param-memory param-notes param-personal param-preset param-research param-sessions param-signature param-skills param-tasks param-theme param-webhook
# Zsh tab-completion for the param umbrella + sub-CLIs.
#
# Drop in any directory on $fpath, e.g.:
#     fpath=(/path/to/param-ui/scripts/_completion $fpath)
#     autoload -U compinit; compinit
#
# Then `param <tab>` completes subcommands; `param mail <tab>`
# completes mail subcommands; `param-mail <tab>` works the same.

_param_scripts_dir() {
    local self="${(%):-%x}"
    while [[ -L "$self" ]]; do self="$(readlink "$self")"; done
    cd "${self:h}/.." && pwd
}

typeset -gA _param_subs

_param_refresh() {
    _param_subs=()
    local dir="$(_param_scripts_dir)"
    local py="$dir/../venv/bin/python"
    [[ -x "$py" ]] || py="$(command -v python3)"
    local f sub help_out commands
    for f in "$dir"/param-*; do
        [[ -x "$f" ]] || continue
        case "$f" in
            *.bak|*.pyc|*.pre-*) continue ;;
        esac
        sub="${${f:t}#param-}"
        help_out=$("$py" "$f" --help 2>/dev/null) || continue
        commands=$(echo "$help_out" | grep -oE '\{[a-z0-9_,-]+\}' | head -1 \
            | tr -d '{}' | tr ',' ' ')
        _param_subs[$sub]="$commands"
    done
}

_param() {
    [[ ${#_param_subs} -eq 0 ]] && _param_refresh

    local cmd="${words[1]}"

    if [[ "$cmd" == "param" ]]; then
        if (( CURRENT == 2 )); then
            local -a subs=(${(k)_param_subs} help)
            _describe 'subcommand' subs
            return
        fi
        local sub="${words[2]}"
        if [[ "$sub" == "help" ]] && (( CURRENT == 3 )); then
            local -a subs=(${(k)_param_subs})
            _describe 'subcommand' subs
            return
        fi
        if (( CURRENT == 3 )); then
            local -a sc=(${(s/ /)_param_subs[$sub]})
            _describe 'command' sc
            return
        fi
        return
    fi

    # param-foo <tab>
    local sub="${cmd#param-}"
    if (( CURRENT == 2 )); then
        local -a sc=(${(s/ /)_param_subs[$sub]})
        _describe 'command' sc
        return
    fi
}

_param "$@"
