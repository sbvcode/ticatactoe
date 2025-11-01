package com.example.tictactoe

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.tictactoe.R

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    TicTacToeScreen()
                }
            }
        }
    }
}

private enum class Player(val symbol: String) {
    X("X"),
    O("O")
}

@Composable
private fun TicTacToeScreen() {
    val board = remember { mutableStateListOf(*Array(9) { "" }) }
    var currentPlayer by remember { mutableStateOf(Player.X) }
    var winner by remember { mutableStateOf<Player?>(null) }
    var isDraw by remember { mutableStateOf(false) }

    fun resetGame() {
        board.indices.forEach { board[it] = "" }
        currentPlayer = Player.X
        winner = null
        isDraw = false
    }

    fun makeMove(index: Int) {
        if (board[index].isNotEmpty() || winner != null || isDraw) return

        board[index] = currentPlayer.symbol
        winner = checkWinner(board)

        if (winner == null) {
            if (board.none { it.isEmpty() }) {
                isDraw = true
            } else {
                currentPlayer = if (currentPlayer == Player.X) Player.O else Player.X
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = when {
                winner == Player.X -> stringResource(R.string.x_wins)
                winner == Player.O -> stringResource(R.string.o_wins)
                isDraw -> stringResource(R.string.draw)
                else -> "Player ${currentPlayer.symbol}'s turn"
            },
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        for (row in 0 until 3) {
            Row(horizontalArrangement = Arrangement.Center) {
                for (col in 0 until 3) {
                    val index = row * 3 + col
                    Cell(
                        symbol = board[index],
                        onClick = { makeMove(index) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(onClick = { resetGame() }) {
            Text(text = stringResource(R.string.reset))
        }
    }
}

@Composable
private fun Cell(symbol: String, onClick: () -> Unit) {
    val background = when (symbol) {
        Player.X.symbol -> Color(0xFF8BC34A)
        Player.O.symbol -> Color(0xFF29B6F6)
        else -> MaterialTheme.colorScheme.surface
    }

    Box(
        modifier = Modifier
            .padding(4.dp)
            .size(96.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.primaryContainer)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxSize()
                .clip(RoundedCornerShape(12.dp))
                .background(background),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = symbol,
                fontSize = 36.sp,
                fontWeight = FontWeight.Bold,
                color = if (symbol.isEmpty()) {
                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                } else {
                    MaterialTheme.colorScheme.onPrimaryContainer
                }
            )
        }
    }
}

private fun checkWinner(board: List<String>): Player? {
    val winningPositions = listOf(
        listOf(0, 1, 2),
        listOf(3, 4, 5),
        listOf(6, 7, 8),
        listOf(0, 3, 6),
        listOf(1, 4, 7),
        listOf(2, 5, 8),
        listOf(0, 4, 8),
        listOf(2, 4, 6)
    )

    for ((a, b, c) in winningPositions) {
        if (board[a].isNotEmpty() && board[a] == board[b] && board[a] == board[c]) {
            return Player.values().first { it.symbol == board[a] }
        }
    }
    return null
}
