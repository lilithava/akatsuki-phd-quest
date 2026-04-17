/* Edit step button */
.edit-step-btn {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 0.8rem;
    margin-left: 0.5rem;
    padding: 0;
}

.edit-step-btn:hover {
    color: var(--red);
}

.add-step-btn {
    background: #2a2a2e;
    border: none;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.7rem;
    margin-top: 0.5rem;
    margin-right: 0.5rem;
}

.step-label {
    flex: 1;
    cursor: text;
}

.step-label[contenteditable="true"]:hover {
    background: #2a2a2e;
    border-radius: 4px;
}

/* Report output */
#reportOutput {
    background: #0a0a0c;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    font-family: monospace;
    white-space: pre-wrap;
    font-size: 0.8rem;
    margin-top: 1rem;
    display: none;
}

#reportOutput:not(:empty) {
    display: block;
}
